export function ForwardProps<T>(props: T & { render: (props: T) => any }) {
  return props.render(props);
}
