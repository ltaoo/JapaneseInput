import { file_request, request } from "@/biz/requests";

/**
 * 使用平假名搜索对应汉字
 */
export function search_kanji(text: string) {
  return request.get<{
    list: string[];
  }>("/api/v1/def/search", { text });
}
export function fetch_kanji_dict() {
  return file_request.get<string>(
    "/public/dict2.txt",
    {},
    {
      headers: {
        ContentType: "text/plain; charset=utf-8",
      },
    }
  );
}
export function fetch_kanji_patch_dict() {
  return file_request.get<string>(
    "/public/dict2_patch.txt",
    {},
    {
      headers: {
        ContentType: "text/plain; charset=utf-8",
      },
    }
  );
}
