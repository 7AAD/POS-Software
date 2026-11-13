import type { OrderCartState } from '../data/use-order-cart';
import type { OrderNavigation } from '../data/use-order-navigation';
import { Modal } from './Modal';

export function OrderSwitchDialog({ cart, navigation }: { cart: OrderCartState; navigation: OrderNavigation }) {
  if (!navigation.pending) return navigation.error ?
    <Modal title="Order could not be opened" onClose={navigation.dismissError}>
      <p role="alert" className="form-error">{navigation.error}</p>
      <div className="form-actions details-actions"><button type="button" onClick={navigation.cancel}>Keep editing</button></div>
    </Modal> : null;

  return (
    <Modal title="Save changes first?" busy={navigation.working} onClose={navigation.cancel}>
      <p>{cart.activeOrder ? `Order #${cart.activeOrder.number} has unsaved changes.` : 'This draft has not been saved.'}
        {' '}Save before {navigation.pending.kind === 'new' ? 'starting a new order' : 'opening another order'}?</p>
      {cart.activeOrder && <p className="field-help">Discarding changes keeps the last saved copy.</p>}
      {cart.lines.length === 0 && <p className="field-help">An order needs at least one item to be saved.</p>}
      {navigation.error && <p role="alert" className="form-error">{navigation.error}</p>}
      <div className="form-actions details-actions">
        <button type="button" className="secondary" disabled={navigation.working} onClick={navigation.cancel}>Keep editing</button>
        <button type="button" className="secondary" disabled={navigation.working} onClick={navigation.discardAndContinue}>Discard changes</button>
        <button type="button" disabled={navigation.working || cart.lines.length === 0} onClick={navigation.saveAndContinue}>
          {navigation.working ? 'Please wait…' : 'Save and switch'}
        </button>
      </div>
    </Modal>
  );
}
