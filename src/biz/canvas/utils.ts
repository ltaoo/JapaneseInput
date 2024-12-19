export { math } from "@/utils/math/index";

/**
 * uuid 工厂函数
 */
export function uuidFactory() {
  let _uuid = -1;
  return function uuid() {
    // console.log("[UTILS]uuid", _uuid);
    _uuid += 1;
    return _uuid;
  };
  // function setUuid(nextUuid: number) {
  //   _uuid = nextUuid;
  //   return _uuid;
  // }
}
