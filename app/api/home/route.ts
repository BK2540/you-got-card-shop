import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth-server";

const withFeaturedImage = <
  T extends {
    featured?: {
      images?: { url: string; isHero: boolean }[];
    } | null;
  },
>(
  content: T | null,
) => {
  if (!content?.featured) {
    return content;
  }

  const heroImage =
    content.featured.images?.find((image) => image.isHero)?.url ||
    content.featured.images?.[0]?.url ||
    "";

  return {
    ...content,
    featured: {
      ...content.featured,
      image: heroImage,
    },
  };
};

// GET home content
export async function GET() {
  try {
    const content = await prisma.homeContent.findFirst({
      include: { featured: { include: { images: true } } },
    });

    return NextResponse.json(withFeaturedImage(content));
  } catch (error) {
    console.error("Failed to fetch home content", error);
    return NextResponse.json(
      { error: "Failed to fetch home content." },
      { status: 500 },
    );
  }
}

// UPDATE home content
export async function PUT(req: Request) {
  const auth = getAuthFromRequest(req);
  if (!auth || auth.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await req.json()) as {
      id?: string;
      title?: string;
      subtitle?: string;
      description?: string;
      price?: number | string;
      featuredId?: string | null;
    };

    const data = {
      title: body.title ?? "",
      subtitle: body.subtitle ?? "",
      description: body.description ?? "",
      price: Number(body.price ?? 0),
      featured: body.featuredId
        ? { connect: { id: body.featuredId } }
        : undefined,
    };

    const updated = await prisma.homeContent.upsert({
      where: { id: body.id || "" },
      update: {
        ...data,
        featured: body.featuredId
          ? { connect: { id: body.featuredId } }
          : { disconnect: true },
      },
      create: data,
      include: { featured: { include: { images: true } } },
    });

    return NextResponse.json(withFeaturedImage(updated));
  } catch {
    return NextResponse.json(
      { error: "Failed to update home content." },
      { status: 500 },
    );
  }
}
