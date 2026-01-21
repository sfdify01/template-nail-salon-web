import { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ModernMenuCard } from './ModernMenuCard';
import { MenuItem, MenuCategory } from '../../hooks/useConfig';
import { useCart } from '../../lib/cart/useCart';
import { toast } from 'sonner@2.0.3';

interface ModernMenuGridProps {
  categories: MenuCategory[];
  dietaryFilters: { id: string; label: string; icon: string }[];
  brandColor: string;
}

export const ModernMenuGrid = ({ categories = [], dietaryFilters = [], brandColor }: ModernMenuGridProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const { addItem } = useCart();

  const toggleFilter = (filterId: string) => {
    setSelectedFilters(prev =>
      prev.includes(filterId)
        ? prev.filter(f => f !== filterId)
        : [...prev, filterId]
    );
  };

  const filterItems = (items: MenuItem[] = []) => {
    if (!items || items.length === 0) return [];
    return items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (item.description || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilters = selectedFilters.length === 0 ||
                            selectedFilters.every(filter => (item.dietary || []).includes(filter));
      return matchesSearch && matchesFilters;
    });
  };

  const handleQuickAdd = (item: MenuItem, qty: number) => {
    addItem({
      sku: item.id,
      name: item.name,
      price: Math.round(item.price * 100), // Convert to cents
      qty,
      image: item.imageUrl || `https://source.unsplash.com/400x300/?${encodeURIComponent(item.image)}`,
    });
    
    toast.success(`Added ${qty}x ${item.name} to cart`, {
      duration: 2000,
    });
  };



  // If no categories, show empty state
  if (!categories || categories.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No products available at this time.</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-3 sm:space-y-4 md:space-y-6">
      {/* Search and Filters */}
      <div className="w-full space-y-2.5 sm:space-y-3 md:space-y-4">
        <div className="relative w-full">
          <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 pointer-events-none" />
          <Input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 sm:pl-9 md:pl-10 pr-3 h-11 sm:h-12 rounded-lg sm:rounded-xl md:rounded-2xl text-sm sm:text-base"
          />
        </div>

        {dietaryFilters && dietaryFilters.length > 0 && (
          <div className="w-full flex flex-wrap gap-1.5 sm:gap-2">
            {dietaryFilters.map((filter) => (
              <Badge
                key={filter.id}
                variant={selectedFilters.includes(filter.id) ? 'default' : 'outline'}
                className="cursor-pointer hover:opacity-80 transition-opacity text-xs sm:text-sm min-h-[36px] sm:min-h-[40px] px-2.5 sm:px-3 rounded-lg"
                style={selectedFilters.includes(filter.id) ? { backgroundColor: brandColor } : {}}
                onClick={() => toggleFilter(filter.id)}
              >
                <span className="mr-1">{filter.icon}</span>
                {filter.label}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Menu Categories */}
      <Tabs defaultValue={categories[0]?.id} className="w-full">
        <div className="relative -mx-3 sm:mx-0 mb-4 sm:mb-6 w-full">
          <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-gray-50 to-transparent pointer-events-none md:hidden z-10" />
          <TabsList className="w-full justify-start overflow-x-auto flex-nowrap rounded-none sm:rounded-xl md:rounded-2xl bg-white border-y sm:border px-3 sm:px-0 scrollbar-hide">
            {categories.map((category) => (
              <TabsTrigger 
                key={category.id} 
                value={category.id}
                className="whitespace-nowrap rounded-lg sm:rounded-xl md:rounded-2xl text-sm sm:text-base min-h-[44px] px-3 sm:px-4 flex-shrink-0"
              >
                <span className="mr-1.5 sm:mr-2 text-base sm:text-lg">{category.icon}</span>
                {category.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {categories.map((category) => {
          const filteredItems = filterItems(category.items);
          
          return (
            <TabsContent key={category.id} value={category.id} className="w-full mt-4 sm:mt-5 md:mt-6">
              <div className="w-full mb-3 sm:mb-4">
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{category.description}</p>
              </div>

              {filteredItems.length === 0 ? (
                <div className="w-full text-center py-8 sm:py-10 md:py-12 text-gray-500 text-sm sm:text-base">
                  No items found matching your search or filters.
                </div>
              ) : (
                <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
                  {filteredItems.map((item) => (
                    <ModernMenuCard
                      key={item.id}
                      item={item}
                      brandColor={brandColor}
                      onAdd={handleQuickAdd}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
};
