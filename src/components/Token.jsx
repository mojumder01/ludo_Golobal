export default function Token({ color, movable, onClick, top, left, nudge = [0, 0] }) {
  const style = {
    top: `${top}%`,
    left: `${left}%`,
    translate: `calc(-50% + ${nudge[0]}px) calc(-50% + ${nudge[1]}px)`,
  };
  return (
    <button
      type="button"
      className={`token token--${color}${movable ? ' token--movable' : ''}`}
      style={style}
      onClick={onClick}
      disabled={!movable}
      aria-label={`${color} token`}
    />
  );
}
