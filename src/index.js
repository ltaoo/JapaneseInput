import "./timeless.js";
import { render } from "@timeless/timeless-dom";
import { ApplicationView } from "./app.js";
import "./style.css";
import "./pages.css";

const root = document.getElementById("root");
if (!root) throw new Error("缺少 #root 挂载节点");
render(ApplicationView(), root);
