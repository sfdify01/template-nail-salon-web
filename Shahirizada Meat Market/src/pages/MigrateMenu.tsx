import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { CheckCircle, XCircle, Upload, ArrowLeft } from 'lucide-react';

// Hardcoded menu data to avoid JSON import issues
const menuData = {
  "categories": [
    {
      "id": "fresh-meats",
      "name": "Fresh Halal Meats",
      "description": "Premium quality, hand-cut daily",
      "icon": "🥩",
      "items": [
        {
          "id": "beef-ribeye",
          "name": "Ribeye Steak",
          "description": "USDA Choice, grass-fed, premium marbling - 1 lb",
          "price": 18.99,
          "image": "ribeye steak beef",
          "imageUrl": "https://source.unsplash.com/800x600/?ribeye+steak",
          "dietary": ["halal"],
          "popular": true
        },
        {
          "id": "beef-ground",
          "name": "Ground Beef",
          "description": "85% lean, freshly ground - 1 lb",
          "price": 8.99,
          "image": "ground beef fresh",
          "imageUrl": "https://source.unsplash.com/800x600/?ground+beef",
          "dietary": ["halal"],
          "popular": true
        },
        {
          "id": "lamb-chops",
          "name": "Lamb Chops",
          "description": "Premium cut, bone-in - 1 lb",
          "price": 22.99,
          "image": "lamb chops meat",
          "imageUrl": "https://source.unsplash.com/800x600/?lamb+chops",
          "dietary": ["halal"],
          "popular": true
        },
        {
          "id": "beef-sirloin",
          "name": "Top Sirloin",
          "description": "Premium cut, trimmed - 1 lb",
          "price": 14.99,
          "image": "sirloin steak beef",
          "imageUrl": "https://source.unsplash.com/800x600/?sirloin+steak",
          "dietary": ["halal"]
        }
      ]
    },
    {
      "id": "prepared-foods",
      "name": "Prepared Foods",
      "description": "Ready to heat and eat",
      "icon": "🍱",
      "items": [
        {
          "id": "beef-kofta",
          "name": "Beef Kofta",
          "description": "Spiced ground beef, formed - 8 pieces",
          "price": 14.99,
          "image": "beef kofta kabob",
          "imageUrl": "https://source.unsplash.com/800x600/?kofta+kabob",
          "dietary": ["halal"]
        },
        {
          "id": "lamb-kebab",
          "name": "Lamb Kebabs",
          "description": "Tender lamb cubes, seasoned - 6 pieces",
          "price": 19.99,
          "image": "lamb kebab skewers",
          "imageUrl": "https://source.unsplash.com/800x600/?lamb+kebab",
          "dietary": ["halal"],
          "popular": true
        }
      ]
    },
    {
      "id": "groceries",
      "name": "Groceries & Staples",
      "description": "Halal-certified products",
      "icon": "🛒",
      "items": [
        {
          "id": "basmati-rice",
          "name": "Basmati Rice",
          "description": "Premium long-grain - 10 lbs",
          "price": 19.99,
          "image": "basmati rice bag",
          "imageUrl": "https://source.unsplash.com/800x600/?basmati+rice",
          "dietary": ["halal", "vegan"]
        },
        {
          "id": "olive-oil",
          "name": "Extra Virgin Olive Oil",
          "description": "Cold-pressed, imported - 1 liter",
          "price": 16.99,
          "image": "olive oil bottle",
          "imageUrl": "https://source.unsplash.com/800x600/?olive+oil",
          "dietary": ["halal", "vegan"]
        },
        {
          "id": "spice-mix",
          "name": "Middle Eastern Spice Mix",
          "description": "Authentic blend - 8 oz",
          "price": 8.99,
          "image": "spices middle eastern",
          "imageUrl": "https://source.unsplash.com/800x600/?middle+eastern+spices",
          "dietary": ["halal", "vegan"]
        },
        {
          "id": "pita-bread",
          "name": "Fresh Pita Bread",
          "description": "Handmade daily - 10 pack",
          "price": 5.99,
          "image": "pita bread fresh",
          "imageUrl": "https://source.unsplash.com/800x600/?pita+bread",
          "dietary": ["halal", "vegetarian"]
        },
        {
          "id": "dates",
          "name": "Medjool Dates",
          "description": "Premium, pitted - 1 lb",
          "price": 12.99,
          "image": "medjool dates",
          "imageUrl": "https://source.unsplash.com/800x600/?medjool+dates",
          "dietary": ["halal", "vegan"]
        },
        {
          "id": "hummus",
          "name": "Fresh Hummus",
          "description": "House-made, traditional - 16 oz",
          "price": 7.99,
          "image": "hummus bowl fresh",
          "imageUrl": "https://source.unsplash.com/800x600/?hummus",
          "dietary": ["halal", "vegan"]
        }
      ]
    },
    {
      "id": "specialty",
      "name": "Specialty Items",
      "description": "Imported delicacies",
      "icon": "⭐",
      "items": [
        {
          "id": "saffron",
          "name": "Premium Saffron",
          "description": "Persian, grade A - 5 grams",
          "price": 29.99,
          "image": "saffron threads spice",
          "imageUrl": "https://source.unsplash.com/800x600/?saffron",
          "dietary": ["halal", "vegan"]
        },
        {
          "id": "turkish-delight",
          "name": "Turkish Delight",
          "description": "Assorted flavors - 1 lb box",
          "price": 15.99,
          "image": "turkish delight candy",
          "imageUrl": "https://source.unsplash.com/800x600/?turkish+delight",
          "dietary": ["halal"]
        },
        {
          "id": "halal-cheese",
          "name": "Halal Cheese Assortment",
          "description": "Mixed varieties - 1 lb",
          "price": 13.99,
          "image": "cheese platter assorted",
          "imageUrl": "https://source.unsplash.com/800x600/?cheese+platter",
          "dietary": ["halal", "vegetarian"]
        },
        {
          "id": "honey",
          "name": "Wild Flower Honey",
          "description": "Raw, unfiltered - 16 oz",
          "price": 14.99,
          "image": "honey jar natural",
          "imageUrl": "https://source.unsplash.com/800x600/?honey+jar",
          "dietary": ["halal", "vegetarian"]
        }
      ]
    }
  ]
};

interface MigrateMenuProps {
  onNavigate: (path: string) => void;
}

export const MigrateMenu = ({ onNavigate }: MigrateMenuProps) => {
  const [migrating, setMigrating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleMigrate = async () => {
    setMigrating(true);
    setError(null);
    setResult(null);

    try {
      const { projectId, publicAnonKey } = await import('../utils/supabase/info');
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-a05c3297/migrate-menu`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify(menuData),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Migration failed');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect to server');
    } finally {
      setMigrating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => onNavigate('/')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          
          <h1 className="text-3xl mb-2">Migrate Menu to Server</h1>
          <p className="text-gray-600">
            This will upload your menu data from <code className="bg-gray-100 px-2 py-1 rounded">menu-halal-market.json</code> to the server's KV store.
          </p>
        </div>

        {/* Info Alert */}
        <Alert className="mb-6 bg-blue-50 border-blue-200">
          <AlertDescription>
            <strong>ℹ️ First Time Setup:</strong> Run this migration once to upload your menu to the server. 
            After migration, your menu will be loaded from the server instead of local JSON files.
          </AlertDescription>
        </Alert>

        {/* Menu Preview */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl mb-4">Menu Data Preview</h2>
          <div className="space-y-2 text-sm">
            <p><strong>Categories:</strong> {menuData.categories.length}</p>
            <p><strong>Total Items:</strong> {menuData.categories.reduce((sum, cat) => sum + cat.items.length, 0)}</p>
            <div className="mt-4">
              <p className="mb-2"><strong>Categories:</strong></p>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                {menuData.categories.map((cat) => (
                  <li key={cat.id}>
                    {cat.icon} {cat.name} ({cat.items.length} items)
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>

        {/* Migration Button */}
        <div className="mb-6">
          <Button
            onClick={handleMigrate}
            disabled={migrating}
            size="lg"
            className="w-full"
          >
            {migrating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Migrating Menu...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Migrate Menu to Server
              </>
            )}
          </Button>
        </div>

        {/* Success Result */}
        {result && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <div className="space-y-2">
                <p className="font-medium">Migration successful!</p>
                <div className="text-sm space-y-1">
                  <p>✅ Categories migrated: {result.categories}</p>
                  <p>✅ Items migrated: {result.items}</p>
                </div>
                <p className="text-sm mt-3">
                  Your menu is now stored in the server's KV store and will be loaded automatically.
                </p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Error */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <XCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <p className="font-medium">Migration failed</p>
              <p className="text-sm mt-1">{error}</p>
            </AlertDescription>
          </Alert>
        )}

        {/* Instructions */}
        <Card className="p-6">
          <h3 className="text-lg mb-3">How it works</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
            <li>Click the "Migrate Menu to Server" button above</li>
            <li>Your menu data will be uploaded to the Supabase KV store</li>
            <li>The menu will automatically load from the server on future page loads</li>
            <li>You can manage menu items via the Admin panel at <code className="bg-gray-100 px-2 py-1 rounded">/admin</code></li>
          </ol>
          
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> This migration will replace any existing menu data in the server. 
              Make sure this is what you want before proceeding.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};
