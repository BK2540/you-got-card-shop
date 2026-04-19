import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { CardStatus } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { getAuthFromRequest } from "@/lib/auth-server";

type CardWithImages = {
  id: string;
  name: string;
  playerName: string;
  team: string;
  price: number;
  grade: string;
  year: number;
  quantity: number;
  status: CardStatus;
  isRecommended: boolean;
  description: string;
  createdAt: Date;
  images: {
    id: string;
    url: string;
    isHero: boolean;
    cardId: string;
  }[];
};

type ImageOrderItem = {
  type: "existing" | "new";
  url?: string;
};

const uploadDir = path.join(process.cwd(), "public", "uploads", "cards");

const sortImagesWithHeroFirst = (images: CardWithImages["images"]) => {
  const heroImage = images.find((image) => image.isHero);
  const remainingImages = images.filter((image) => !image.isHero);

  return heroImage ? [heroImage, ...remainingImages] : images;
};

const formatCard = (card: CardWithImages) => {
  const images = sortImagesWithHeroFirst(card.images);

  return {
    ...card,
    images,
    image: images[0]?.url ?? "",
  };
};

const resolveImageOrder = (formData: FormData) => {
  const rawImageOrder = formData.get("imageOrder");

  if (typeof rawImageOrder !== "string") {
    return [] as ImageOrderItem[];
  }

  try {
    const parsed = JSON.parse(rawImageOrder) as ImageOrderItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveUploadedImage = async (file: File) => {
  const ext = path.extname(file.name) || ".png";
  const fileName = `${randomUUID()}${ext.toLowerCase()}`;
  const filePath = path.join(uploadDir, fileName);
  const buffer = Buffer.from(await file.arrayBuffer());

  await writeFile(filePath, buffer);

  return {
    url: `/uploads/cards/${fileName}`,
  };
};

// DELETE
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = getAuthFromRequest(req);
  if (!auth || auth.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  await prisma.card.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}

// UPDATE
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = getAuthFromRequest(req);
  if (!auth || auth.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const formData = await req.formData();

    const name = formData.get("name")?.toString().trim() ?? "";
    const playerName = formData.get("playerName")?.toString().trim() ?? "";
    const team = formData.get("team")?.toString().trim() ?? "";
    const grade = formData.get("grade")?.toString().trim() ?? "";
    const price = Number(formData.get("price"));
    const year = Number(formData.get("year"));
    const quantity = Number(formData.get("quantity"));
    const isRecommended =
      formData.get("isRecommended")?.toString() === "true";
    const description = formData.get("description")?.toString() ?? "";
    const status = (formData.get("status")?.toString() ?? "ACTIVE") as CardStatus;
    const normalizedStatus =
      quantity === 0 ? CardStatus.OUT_OF_STOCK : status;
    const files = formData
      .getAll("images")
      .filter((f): f is File => f instanceof File && f.size > 0);
    const imageOrder = resolveImageOrder(formData);

    if (
      !name ||
      !playerName ||
      !team ||
      !grade ||
      Number.isNaN(price) ||
      Number.isNaN(year) ||
      Number.isNaN(quantity)
    ) {
      return NextResponse.json(
        { error: "All card fields are required" },
        { status: 400 },
      );
    }

    if (!Object.values(CardStatus).includes(normalizedStatus)) {
      return NextResponse.json(
        { error: "Invalid card status" },
        { status: 400 },
      );
    }

    if (files.some((file) => !file.type.startsWith("image/"))) {
      return NextResponse.json(
        { error: "Only image uploads are supported" },
        { status: 400 },
      );
    }

    if (imageOrder.length === 0) {
      return NextResponse.json(
        { error: "At least one image is required" },
        { status: 400 },
      );
    }

    await mkdir(uploadDir, { recursive: true });

    let nextNewFileIndex = 0;
    const orderedImages = await Promise.all(
      imageOrder.map(async (item) => {
        if (item.type === "existing" && item.url) {
          return {
            url: item.url,
          };
        }

        const file = files[nextNewFileIndex];
        nextNewFileIndex += 1;

        if (!file) {
          return null;
        }

        return saveUploadedImage(file);
      }),
    );

    const finalImages = orderedImages
      .filter((image): image is { url: string } => Boolean(image))
      .map((image, index) => ({
        ...image,
        isHero: index === 0,
      }));

    if (finalImages.length === 0) {
      return NextResponse.json(
        { error: "At least one image is required" },
        { status: 400 },
      );
    }

    await prisma.cardImage.deleteMany({
      where: { cardId: id },
    });

    const updated = await prisma.card.update({
      where: { id },
      data: {
        name,
        playerName,
        team,
        price,
        grade,
        year,
        quantity,
        isRecommended,
        description,
        status: normalizedStatus,
        images: {
          create: finalImages,
        },
      },
      include: {
        images: true,
      },
    });

    return NextResponse.json(formatCard(updated));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
