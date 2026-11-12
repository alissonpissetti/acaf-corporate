import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { EmployeeDto } from '../api/client';
import { canCancelInvite, canSendInvite, cancelInviteLabel } from '../utils/employeeActions';

const MENU_MIN_WIDTH_PX = 216;
const MENU_OFFSET_PX = 6;

type EmployeeRowActionsProps = {
  emp: EmployeeDto;
  disabled?: boolean;
  onProfile: () => void;
  onCopyInviteLink: () => void;
  onToggleStatus: () => void;
  onCancelOrRemove: () => void;
};

export function EmployeeRowActions({
  emp,
  disabled = false,
  onProfile,
  onCopyInviteLink,
  onToggleStatus,
  onCancelOrRemove,
}: EmployeeRowActionsProps) {
  const [open, setOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const updateMenuPosition = () => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const viewportPad = 8;
    let left = rect.right - MENU_MIN_WIDTH_PX;
    left = Math.max(viewportPad, Math.min(left, window.innerWidth - MENU_MIN_WIDTH_PX - viewportPad));
    let top = rect.bottom + MENU_OFFSET_PX;
    const menuHeight = menuRef.current?.offsetHeight ?? 120;
    if (top + menuHeight > window.innerHeight - viewportPad) {
      top = Math.max(viewportPad, rect.top - menuHeight - MENU_OFFSET_PX);
    }
    setMenuPosition({ top, left });
  };

  useLayoutEffect(() => {
    if (!open) {
      setMenuPosition(null);
      return;
    }
    updateMenuPosition();
    const frame = requestAnimationFrame(() => updateMenuPosition());
    return () => cancelAnimationFrame(frame);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (ev: MouseEvent) => {
      const target = ev.target as Node;
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') setOpen(false);
    };
    const onReposition = () => updateMenuPosition();
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', onReposition);
    window.addEventListener('scroll', onReposition, true);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', onReposition);
      window.removeEventListener('scroll', onReposition, true);
    };
  }, [open]);

  const showCopyLink = canSendInvite(emp);
  const showToggle = emp.status === 'active' || emp.status === 'inactive';
  const showCancel = canCancelInvite(emp);
  const hasMenu = showCopyLink || showToggle || showCancel;

  const closeAnd = (fn: () => void) => () => {
    setOpen(false);
    fn();
  };

  return (
    <div className="employee-row-actions" ref={rootRef}>
      <button
        type="button"
        className="btn btn-secondary btn-sm"
        disabled={disabled}
        onClick={onProfile}
      >
        Perfil
      </button>

      {hasMenu ? (
        <div className="employee-row-actions__dropdown">
          <button
            ref={triggerRef}
            type="button"
            className="btn btn-ghost btn-sm employee-row-actions__trigger employee-row-actions__trigger--icon"
            disabled={disabled}
            aria-expanded={open}
            aria-haspopup="menu"
            aria-controls={menuId}
            aria-label="Mais opções"
            title="Mais opções"
            onClick={() => setOpen((current) => !current)}
          >
            <span className="employee-row-actions__more-icon" aria-hidden="true">
              ⋯
            </span>
          </button>

          {open && menuPosition
            ? createPortal(
                <div
                  ref={menuRef}
                  className="employee-row-actions__menu employee-row-actions__menu--floating"
                  id={menuId}
                  role="menu"
                  style={{
                    position: 'fixed',
                    top: menuPosition.top,
                    left: menuPosition.left,
                    minWidth: MENU_MIN_WIDTH_PX,
                  }}
                >
                  {showCopyLink ? (
                    <button
                      type="button"
                      role="menuitem"
                      className="employee-row-actions__item"
                      onClick={closeAnd(onCopyInviteLink)}
                    >
                      Copiar link de convite
                    </button>
                  ) : null}
                  {showToggle ? (
                    <button
                      type="button"
                      role="menuitem"
                      className="employee-row-actions__item"
                      onClick={closeAnd(onToggleStatus)}
                    >
                      {emp.status === 'active' ? 'Inativar' : 'Reativar'}
                    </button>
                  ) : null}
                  {showCancel ? (
                    <>
                      {showCopyLink || showToggle ? (
                        <div className="employee-row-actions__divider" role="separator" />
                      ) : null}
                      <button
                        type="button"
                        role="menuitem"
                        className="employee-row-actions__item employee-row-actions__item--danger"
                        onClick={closeAnd(onCancelOrRemove)}
                      >
                        {cancelInviteLabel(emp)}
                      </button>
                    </>
                  ) : null}
                </div>,
                document.body,
              )
            : null}
        </div>
      ) : null}
    </div>
  );
}
