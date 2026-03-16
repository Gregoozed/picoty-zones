import { type ProductType, PRODUCT_LABELS } from '../../types';

interface ProductSelectorProps {
  product: ProductType;
  onChange: (product: ProductType) => void;
}

const PRODUCTS: ProductType[] = ['PP', 'ADBLUE', 'PELLETS_LIV', 'PELLETS_VRAC'];

export default function ProductSelector({ product, onChange }: ProductSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {PRODUCTS.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onChange(p)}
          className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
            product === p
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {PRODUCT_LABELS[p]}
        </button>
      ))}
    </div>
  );
}
