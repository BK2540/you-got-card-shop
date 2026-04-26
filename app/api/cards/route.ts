import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { CardStatus, Prisma } from "@prisma/client";
import { getAuthFromRequest } from "@/lib/auth-server";
import { uploadCardImage } from "@/lib/cloudinary";

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
    publicId: string | null;
    isHero: boolean;
    cardId: string;
  }[];
};

type ImageOrderItem = {
  type: "existing" | "new";
  url?: string;
};

const NEW_ARRIVAL_DAYS = 7;

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

const toValidNumber = (value: string | null) => {
  if (!value) return undefined;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
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

// GET all cards
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const view = searchParams.get("view");

  if (view !== "admin") {
    const search = searchParams.get("search")?.trim() ?? "";
    const team = searchParams.get("team")?.trim() ?? "";
    const grade = searchParams.get("grade")?.trim() ?? "";
    const year = searchParams.get("year")?.trim() ?? "";
    const playerName = searchParams.get("playerName")?.trim() ?? "";
    const minPrice = toValidNumber(searchParams.get("minPrice"));
    const maxPrice = toValidNumber(searchParams.get("maxPrice"));
    const section = searchParams.get("section");
    const newArrivalSince = new Date(
      Date.now() - NEW_ARRIVAL_DAYS * 24 * 60 * 60 * 1000,
    );
    const limitParam = Number(searchParams.get("limit") ?? "");
    const limit =
      Number.isFinite(limitParam) && limitParam > 0
        ? Math.min(limitParam, 24)
        : undefined;

    const where: Prisma.CardWhereInput = {
      status: CardStatus.ACTIVE,
      ...(search
        ? {
            OR: [
              { name: { contains: search } },
              { playerName: { contains: search } },
              { team: { contains: search } },
              { grade: { contains: search } },
            ],
          }
        : {}),
      ...(team ? { team: { contains: team } } : {}),
      ...(grade ? { grade: { contains: grade } } : {}),
      ...(playerName ? { playerName: { contains: playerName } } : {}),
      ...(year && Number.isFinite(Number(year)) ? { year: Number(year) } : {}),
      ...((minPrice !== undefined || maxPrice !== undefined)
        ? {
            price: {
              ...(minPrice !== undefined ? { gte: minPrice } : {}),
              ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
            },
          }
        : {}),
      ...(section === "recommended" ? { isRecommended: true } : {}),
      ...(section === "new-arrival" ? { createdAt: { gte: newArrivalSince } } : {}),
    };

    const cards = await prisma.card.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        images: true,
      },
    });

    const formattedCards = cards.map((card) => ({
      ...formatCard(card),
      isNewArrival: card.createdAt >= newArrivalSince,
    }));

    if (section === "recommended") {
      return NextResponse.json(
        formattedCards.filter((card) => card.isRecommended),
      );
    }

    if (section === "new-arrival") {
      return NextResponse.json(formattedCards);
    }

    return NextResponse.json(formattedCards);
  }

  const auth = getAuthFromRequest(req);
  if (!auth || auth.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const pageSize = Math.min(
    20,
    Math.max(1, Number(searchParams.get("pageSize") ?? "6")),
  );
  const search = searchParams.get("search")?.trim() ?? "";
  const status = searchParams.get("status") ?? "ALL";
  const recommendation = searchParams.get("recommendation") ?? "ALL";
  const sortBy = searchParams.get("sortBy") ?? "createdAt";
  const sortDirection =
    searchParams.get("sortDirection") === "asc" ? "asc" : "desc";

  const where: Prisma.CardWhereInput = {
    ...(search
      ? {
          OR: [
            { name: { contains: search } },
            { playerName: { contains: search } },
            { team: { contains: search } },
            { grade: { contains: search } },
          ],
        }
      : {}),
    ...(status !== "ALL" && Object.values(CardStatus).includes(status as CardStatus)
      ? { status: status as CardStatus }
      : {}),
    ...(recommendation === "RECOMMENDED"
      ? { isRecommended: true }
      : recommendation === "NOT_RECOMMENDED"
        ? { isRecommended: false }
        : {}),
  };

  const sortableFields = new Set([
    "createdAt",
    "name",
    "playerName",
    "price",
    "quantity",
    "year",
    "status",
    "isRecommended",
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
    recommendation,
  });
}

// CREATE card
export async function POST(req: Request) {
  const auth = getAuthFromRequest(req);
  if (!auth || auth.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
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
      .filter((value): value is File => value instanceof File && value.size > 0);

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

    if (files.length === 0) {
      return NextResponse.json(
        { error: "At least one image is required" },
        { status: 400 },
      );
    }

    const imageOrder = resolveImageOrder(formData);
    const orderedFiles =
      imageOrder.length > 0
        ? (() => {
            let nextNewFileIndex = 0;
            return imageOrder
              .map((item) => {
                if (item.type !== "new") {
                  return null;
                }

                const file = files[nextNewFileIndex];
                nextNewFileIndex += 1;
                return file ?? null;
              })
              .filter((file): file is File => Boolean(file));
          })()
        : files;

    const uploadedImages = await Promise.all(
      orderedFiles.map((file) => uploadCardImage(file)),
    );
    const images = uploadedImages.map((image, index) => ({
      url: image.url,
      publicId: image.publicId,
      isHero: index === 0,
    }));

    const card = await prisma.card.create({
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
