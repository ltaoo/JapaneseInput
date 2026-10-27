import { AuthPageModel } from "../auth.model.js";

/** @param {ViewComponentProps} props */
export function RegisterPageModel(props) { return AuthPageModel(props, true); }
