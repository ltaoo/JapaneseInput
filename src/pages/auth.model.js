import { InputCore } from "@/domains/ui/input";

/** @param {ViewComponentProps} props */
export function AuthPageModel(props, register = false) {
  const user = props.app.$user;
  const email$ = new InputCore({ defaultValue: "", placeholder: "请输入邮箱", onChange(value) { user.inputEmail(value); } });
  const password$ = new InputCore({ defaultValue: "", type: "password", placeholder: "请输入密码", onChange(value) { user.inputPassword(value); } });
  const methods = {
    async submit() {
      if (submit$.state.loading) return;
      submit$.setLoading(true);
      try {
        const result = await (register ? user.register() : user.login());
        if (register) props.app.tip({ text: [result.error ? result.error.message : "注册成功"] });
      } finally { submit$.setLoading(false); }
    },
    keydown(event) { if (event.key === "Enter") { event.preventDefault(); methods.submit(); } },
  };
  const submit$ = new Timeless.vm.ButtonCore({ onClick: methods.submit });
  return { ui: { email$, password$, submit$ }, methods, title: register ? "管理员注册" : "管理后台登录", label: register ? "注册" : "登录" };
}
