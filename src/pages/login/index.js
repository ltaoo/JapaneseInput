import { AuthPageView } from "../auth.js";
import { LoginPageModel } from "./index.model.js";

/** @param {ViewComponentProps} props */
export default function LoginPageView(props) { return AuthPageView({ vm$: LoginPageModel(props) }); }
