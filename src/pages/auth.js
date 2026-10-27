import { Action, TextField } from "@/components/controls.js";

export function AuthPageView({ vm$ }) {
  return View({ attributes: { n: "account-page", "data-n": "account-page" } }, [
    View({ attributes: { n: "account-form", "data-n": "account-form", role: "form", "aria-label": vm$.title }, onKeyDown: vm$.methods.keydown }, [
      View({ attributes: { n: "account-brand", "data-n": "account-brand", "aria-hidden": "true" } }, ["あ"]),
      View({ attributes: { n: "account-title", "data-n": "account-title", role: "heading", "aria-level": "1" }, class: "page-title" }, [vm$.title]),
      View({ attributes: { n: "account-description", "data-n": "account-description" }, class: "page-description" }, ["继续你的日语练习。"]),
      View({ attributes: { n: "account-email-field", "data-n": "account-email-field" }, class: "account-field" }, [
        Timeless.Label({ attributes: { n: "account-email-label", "data-n": "account-email-label", for: "account-email" } }, ["邮箱"]),
        TextField({ name: "account-email", id: "account-email", store: vm$.ui.email$, attributes: { autocomplete: "username" } }),
      ]),
      View({ attributes: { n: "account-password-field", "data-n": "account-password-field" }, class: "account-field" }, [
        Timeless.Label({ attributes: { n: "account-password-label", "data-n": "account-password-label", for: "account-password" } }, ["密码"]),
        TextField({ name: "account-password", id: "account-password", store: vm$.ui.password$, attributes: { autocomplete: "current-password" } }),
      ]),
      View({ attributes: { n: "account-submit-row", "data-n": "account-submit-row" } }, [Action({ name: "account-submit", store: vm$.ui.submit$ }, [vm$.label])]),
    ]),
  ]);
}
