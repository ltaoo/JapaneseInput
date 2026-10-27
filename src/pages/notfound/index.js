/** @param {ViewComponentProps} props */
export default function NotFoundPageView(props) {
  return View({ attributes: { n: "not-found-page", "data-n": "not-found-page" } }, [
    View({ attributes: { n: "not-found-code", "data-n": "not-found-code" } }, ["404"]),
    View({ attributes: { n: "not-found-title", "data-n": "not-found-title", role: "heading", "aria-level": "1" }, class: "page-title" }, ["没有找到这个页面"]),
    View({ attributes: { n: "not-found-description", "data-n": "not-found-description" }, class: "page-description" }, ["请检查地址，或返回上一页继续练习。"]),
  ]);
}
