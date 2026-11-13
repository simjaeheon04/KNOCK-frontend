import { useEffect, useRef } from "react";
import {
  ArrowRight,
  Check,
  X,
  DoorOpen,
  Coffee,
  Users,
  House,
  Heart,
  ShieldCheck,
} from "lucide-react";
export const icons = {
  coffee: Coffee,
  users: Users,
  house: House,
  heart: Heart,
};
export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}) {
  return (
    <button className={"button " + variant + " " + className} {...props}>
      {children}
    </button>
  );
}
export function Heading({ eyebrow, children, description }) {
  return (
    <header className="page-heading">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{children}</h1>
      {description && <p className="description">{description}</p>}
    </header>
  );
}
export function Card({ title, children, tint = false, className = "" }) {
  return (
    <section className={"card " + (tint ? "tint " : "") + className}>
      {title && <h2>{title}</h2>}
      {children}
    </section>
  );
}
export function Choice({
  selected,
  title,
  description,
  icon: Icon,
  onClick,
  name,
}) {
  return (
    <button
      type="button"
      className={"choice " + (selected ? "selected" : "")}
      aria-pressed={selected}
      onClick={onClick}
      data-testid={name}
    >
      {Icon && (
        <span className="choice-icon">
          <Icon size={22} />
        </span>
      )}
      <span className="choice-copy">
        <strong>{title}</strong>
        {description && <small>{description}</small>}
      </span>
      <span className="selection-mark" aria-hidden="true">
        {selected ? <Check size={15} /> : null}
      </span>
    </button>
  );
}
export function Actions({ children }) {
  return <div className="actions">{children}</div>;
}
export function Arrow() {
  return <ArrowRight size={17} aria-hidden="true" />;
}
export function PrivacyNote() {
  return (
    <p className="privacy-note">
      <ShieldCheck size={15} /> 원본 음성은 보관하지 않아요.
    </p>
  );
}
export function Empty({
  title = "아직 나눈 대화가 없어요",
  description = "부담 없는 한 문장부터 시작해보세요.",
  children,
}) {
  return (
    <Card className="empty">
      <DoorOpen size={32} strokeWidth={1.4} />
      <h2>{title}</h2>
      <p>{description}</p>
      {children}
    </Card>
  );
}
export function Modal({ title, children, onClose }) {
  const ref = useRef();
  useEffect(() => {
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    (ref.current?.querySelector("button") || ref.current)?.focus();
    function key(e) {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const list = ref.current?.querySelectorAll(
          'button:not(:disabled),a[href],input,textarea,[tabindex="0"]',
        );
        if (!list?.length) return;
        const first = list[0],
          last = list[list.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", key);
      previous?.focus();
    };
  }, [onClose]);
  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        ref={ref}
        tabIndex={-1}
        className="modal"
      >
        <button
          className="icon-button close"
          onClick={onClose}
          aria-label="닫기"
        >
          <X size={22} />
        </button>
        <p className="eyebrow">KNOCK · 노크</p>
        <h2 id="modal-title">{title}</h2>
        {children}
      </section>
    </div>
  );
}
export function Toggle({ checked, onChange, label }) {
  return (
    <label className="toggle-label">
      <span>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="toggle-track" aria-hidden="true">
        <span />
      </span>
      <small>{checked ? "켜짐" : "꺼짐"}</small>
    </label>
  );
}
