import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { CardStatus, Prisma } from "@prisma/client";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

type CardWithImages = {
  id: string;
  name: string;
  team: string;
  price: number;
  grade: string;
  year: number;
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

const saveUploadedImages = async (files: File[]) => {
  await mkdir(uploadDir, { recursive: true });

  return Promise.all(
    files.map(async (file) => {
      const extension = path.extname(file.name) || ".png";
      const fileName = `${randomUUID()}${extension.toLowerCase()}`;
      const filePath = path.join(uploadDir, fileName);
      const fileBuffer = Buffer.from(await file.arrayBuffer());

      await writeFile(filePath, fileBuffer);

      return {
        url: `/uploads/cards/${fileName}`,
      };
    }),
  );
};

// GET all cards
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const view = searchParams.get("view");

  if (view !== "admin") {
    const cards = await prisma.card.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        images: true,
      },
    });

    return NextResponse.json(cards.map(formatCard));
  }

  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const pageSize = Math.min(
    20,
    Math.max(1, Number(searchParams.get("pageSize") ?? "6")),
  );
  const search = searchParams.get("search")?.trim() ?? "";
  const status = searchParams.get("status") ?? "ALL";
  const sortBy = searchParams.get("sortBy") ?? "createdAt";
  const sortDirection =
    searchParams.get("sortDirection") === "asc" ? "asc" : "desc";

  const where: Prisma.CardWhereInput = {
    ...(search
      ? {
          OR: [
            { name: { contains: search } },
            { team: { contains: search } },
            { grade: { contains: search } },
          ],
        }
      : {}),
    ...(status !== "ALL" && Object.values(CardStatus).includes(status as CardStatus)
      ? { status: status as CardStatus }
      : {}),
  };

  const sortableFields = new Set([
    "createdAt",
    "name",
    "price",
    "quantity",
    "year",
    "status",
  ]);
  const normalizedSortBy = sortableFields.has(sortBy) ? sortBy : "createdAt";

  const [cards, totalCount] = await Promise.all([
    prisma.card.findMany({
      where,
      orderBy: { [normalizedSortBy]: sortDirection },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        images: true,
      },
    }),
    prisma.card.count({ where }),
  ]);

  return NextResponse.json({
    items: cards.map(formatCard),
    page,
    pageSize,
    totalCount,
    totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
    sortBy: normalizedSortBy,
    sortDirection,
    search,
    status,
  });
}

// CREATE card
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const name = formData.get("name")?.toString().trim() ?? "";
    const team = formData.get("team")?.toString().trim() ?? "";
    const grade = formData.get("grade")?.toString().trim() ?? "";
    const price = Number(formData.get("price"));
    const year = Number(formData.get("year"));
    const quantity = Number(formData.get("quantity"));
    const description = formData.get("description")?.toString() ?? "";
    const status = (formData.get("status")?.toString() ?? "ACTIVE") as CardStatus;
    const normalizedStatus =
      quantity === 0 ? CardStatus.OUT_OF_STOCK : status;
    const files = formData
      .getAll("images")
      .filter((value): value is File => value instanceof File && value.size > 0);

    if (
      !name ||
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

    if (files.length === 0) {
      return NextResponse.json(
        { error: "At least one image is required" },
        { status: 400 },
      );
    }

    const imageOrder = resolveImageOrder(formData);
    const orderedFiles =
      imageOrder.length > 0
        ? imageOrder
            .filter((item) => item.type === "new")
            .map((_, index) => files[index])
            .filter((file): file is File => Boolean(file))
        : files;

    const uploadedImages = await saveUploadedImages(orderedFiles);
    const images = uploadedImages.map((image, index) => ({
      ...image,
      isHero: index === 0,
    }));

    const card = await prisma.card.create({
      data: {
        name,
        team,
        price,
        grade,
        year,
        quantity,
        description,
        status: normalizedStatus,
        images: {
          create: images,
        },
      },
      include: {
        images: true,
      },
    });

    return NextResponse.json(formatCard(card));
  } catch (error) {
    console.error("Failed to create card", error);

    const message =
      error instanceof Error ? error.message : "Failed to create card";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
