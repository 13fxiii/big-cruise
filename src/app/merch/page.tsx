import { ModulePage } from '@/components/module-page';

export default function MerchPage() {
  return <ModulePage title="Merch" kicker="Store foundation" description="Store architecture for products, images, variants, inventory concepts, carts, and checkout integration without fake payment confirmations." capabilities={['Products', 'Variants', 'Inventory concepts', 'Cart state', 'Checkout adapter', 'Order audit trail']} />;
}
