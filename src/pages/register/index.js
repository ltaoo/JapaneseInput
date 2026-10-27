import { AuthPageView } from "../auth.js";
import { RegisterPageModel } from "./index.model.js";

/** @param {ViewComponentProps} props */
export default function RegisterPageView(props) { return AuthPageView({ vm$: RegisterPageModel(props) }); }
