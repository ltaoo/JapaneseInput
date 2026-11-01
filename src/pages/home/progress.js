export function ChallengeProgress({ state }) {
  return View({ attributes: { n: "challenge-progress", "data-n": "challenge-progress" } }, [
    View({ attributes: { n: "challenge-progress-container", "data-n": "challenge-progress-container" } }, [
      View({ attributes: { n: "challenge-progress-summary", "data-n": "challenge-progress-summary" } }, [
        View({ attributes: { n: "challenge-progress-label", "data-n": "challenge-progress-label" } }, ["本轮进度"]),
        View({ attributes: { n: "challenge-position", "data-n": "challenge-position" } }, [computed(state.index, (v) => `${v}/${state.total}`)]),
      ]),
      View({ attributes: { n: "challenge-progress-track", "data-n": "challenge-progress-track", role: "progressbar", "aria-valuemin": 0, "aria-valuemax": 100, "aria-valuenow": state.progress, "aria-label": "挑战进度" } }, [
        View({ attributes: { n: "challenge-progress-fill", "data-n": "challenge-progress-fill" }, style: { width: computed(state.progress, (v) => `${v}%`) } }),
      ]),
      Show({ when: state.completed, ok: () => [View({ attributes: { n: "challenge-completed", "data-n": "challenge-completed", "aria-live": "polite" }, class: "mt-2 text-center" }, ["挑战完成"])] }),
    ]),
  ]);
}
