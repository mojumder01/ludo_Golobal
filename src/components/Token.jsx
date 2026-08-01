export default function Token({ color, movable, active, onClick, offset }) {
  const style = offset
    ? { transform: `translate(calc(-50% + ${offset[0]}px), calc(-50% + ${offset[1]}px))` }
    : undefined;
  return (
    <button
      type="button"
      className={`token token--${color}${movable ? ' token--movable' : ''}${active ? ' token--active' : ''}`}
      style={style}
      onClick={onClick}
      disabled={!movable}
      aria-label={`${color} token`}
    />
  );
}
