import "./CircularProgress.css";

export default function CircularProgress({
    percentage = 0,
    size = 120,
    strokeWidth = 8,
    label = "",
    sublabel = "",
    color = "var(--accent-gold)",
}) {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <div className="circular-progress" style={{ width: size, height: size }}>
            <svg viewBox={`0 0 ${size} ${size}`} className="circular-svg">
                <circle
                    className="circular-bg"
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    strokeWidth={strokeWidth}
                />
                <circle
                    className="circular-fill"
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    style={{ stroke: color }}
                />
            </svg>
            <div className="circular-content">
                <span className="circular-label">{label}</span>
                {sublabel && <span className="circular-sublabel">{sublabel}</span>}
            </div>
        </div>
    );
}
