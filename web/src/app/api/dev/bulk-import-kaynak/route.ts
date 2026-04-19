import { NextResponse } from "next/server";
import path from "path";
import {
  bulkImportExcelKaynakDir,
  defaultKaynakDirFromWebRoot,
} from "@/services/excel-sources/bulk-import-kaynak";
import { getMockStore } from "@/lib/mock-db";

export async function POST() {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_BULK_IMPORT !== "1") {
    return NextResponse.json(
      { ok: false, error: "Üretimde kapalı. ALLOW_BULK_IMPORT=1 ile açılır." },
      { status: 403 }
    );
  }

  const store = getMockStore();
  const dir = defaultKaynakDirFromWebRoot(process.cwd());

  try {
    const result = await bulkImportExcelKaynakDir(dir, {
      fabricTypes: store.fabricTypes,
      recipes: store.fabricRecipes,
      machines: store.machines,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}

export async function GET() {
  const dir = defaultKaynakDirFromWebRoot(process.cwd());
  return NextResponse.json({
    hint: "POST ile `data/excel-kaynak` içindeki tüm .xlsx dosyaları içe aktarılır (mock/Firebase yapılandırmasına göre).",
    kaynakDir: path.normalize(dir),
  });
}
