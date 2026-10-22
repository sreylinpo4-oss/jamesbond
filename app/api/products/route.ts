import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { products as bundledProducts, type Product } from "@/lib/products";

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseAnonKey && supabaseUrl !== "https://placeholder.supabase.co") {
    try {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const { data, error } = await supabase
        .from("products")
        .select("id, name, category, sku, price_cents, description, detail, image_url, tag, benefits, brand, role, origin")
        .eq("active", true)
        .order("id");

    if (!error && Array.isArray(data) && data.length > 0) {
      const liveProducts: Product[] = data.map((raw) => {
        const item = raw as Record<string, any>;
        const fallbackMatch = bundledProducts.find((p) => p.id === item.id);
        return {
          id: item.id,
          name: item.name,
          category: item.category,
          brand: (typeof item.brand === "string" && item.brand) || fallbackMatch?.brand || "Floralyn Signature",
          role: (typeof item.role === "string" && item.role) || fallbackMatch?.role || "Botanical Skincare",
          origin: ((typeof item.origin === "string" && item.origin) || fallbackMatch?.origin || "Floralyn Signature") as Product["origin"],
          price: item.price_cents / 100,
          description: item.description || fallbackMatch?.description || "",
          detail: item.detail || item.description || fallbackMatch?.detail || "",
          image: item.image_url || fallbackMatch?.image || bundledProducts[0]?.image || "",
          tag: item.tag || fallbackMatch?.tag || "",
          benefits: Array.isArray(item.benefits) && item.benefits.length > 0 ? item.benefits : fallbackMatch?.benefits || [],
        };
      });

      return NextResponse.json(
        { products: liveProducts, source: "database" },
        {
          headers: {
            "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
          },
        },
      );
    }
  } catch (err) {
    console.warn("Unable to fetch products from Supabase, falling back to static catalog:", err);
  }
  }

  return NextResponse.json(
    { products: bundledProducts, source: "bundled" },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    },
  );
}
