# 日语输入组件

适用于一些需要输入日文的场景

## 使用方式

### React

```js

```

### SolidJS

```js
const $jp = JapaneseInput({});

onMount(() => {
  // 加载额外的字典
  $jp.loadDict();
});

return <JapaneseInput store={$jp} />;
```

