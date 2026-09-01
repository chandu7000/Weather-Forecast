const HighlightBox = ({ title, value, Icon, subtitle }) => {
  return (
    <article className="highlight-card">
      <div className="highlight-card-head">
        <span>{title}</span>
        {Icon && (
          <span className="highlight-icon" aria-hidden="true">
            <Icon />
          </span>
        )}
      </div>
      <div className="highlight-value">{value}</div>
      {subtitle && <div className="highlight-subtitle">{subtitle}</div>}
    </article>
  );
};

export default HighlightBox;
