/**
 * Auto Image Generator for Menu Items
 * 
 * This utility automatically generates and caches image URLs for menu items.
 * Can be run on menu load or as a build-time script to populate menu.json files.
 */

import type { MenuItem } from './types';

export interface MenuCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  items: MenuItem[];
}

export interface MenuData {
  categories: MenuCategory[];
  dietaryFilters?: Array<{
    id: string;
    label: string;
    icon: string;
  }>;
}

/**
 * Image source providers
 */
export enum ImageProvider {
  UNSPLASH = 'unsplash',
  PEXELS = 'pexels',
  FOODISH = 'foodish',
  LOREMFLICKR = 'loremflickr',
}

/**
 * Generate image URL based on provider
 */
export function generateImageUrlByProvider(
  query: string,
  provider: ImageProvider = ImageProvider.UNSPLASH,
  width: number = 800,
  height: number = 600
): string {
  const encodedQuery = encodeURIComponent(query);

  switch (provider) {
    case ImageProvider.UNSPLASH:
      return `https://source.unsplash.com/${width}x${height}/?${encodedQuery}`;
    
    case ImageProvider.LOREMFLICKR:
      return `https://loremflickr.com/${width}/${height}/${encodedQuery}`;
    
    case ImageProvider.PEXELS:
      // Pexels doesn't have a simple source API, would need API key
      // Fallback to Unsplash
      return `https://source.unsplash.com/${width}x${height}/?${encodedQuery}`;
    
    case ImageProvider.FOODISH:
      // Foodish API returns random food images (no query support)
      // Fallback to Unsplash with food query
      return `https://source.unsplash.com/${width}x${height}/?food+${encodedQuery}`;
    
    default:
      return `https://source.unsplash.com/${width}x${height}/?${encodedQuery}`;
  }
}

/**
 * Process menu data and attach image URLs to items missing them
 */
export function attachImagesToMenuData(
  menuData: MenuData,
  provider: ImageProvider = ImageProvider.UNSPLASH
): MenuData {
  const processedCategories = menuData.categories.map(category => ({
    ...category,
    items: category.items.map(item => {
      // Skip if item already has imageUrl
      if (item.imageUrl) {
        return item;
      }

      // Generate query from item.image or item.name
      const query = item.image 
        ? item.image.replace(/\s+/g, '+')
        : item.name.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '+');

      return {
        ...item,
        imageUrl: generateImageUrlByProvider(query, provider),
      };
    }),
  }));

  return {
    ...menuData,
    categories: processedCategories,
  };
}

/**
 * Extract all items from menu data
 */
export function getAllMenuItems(menuData: MenuData): MenuItem[] {
  return menuData.categories.flatMap(category => category.items);
}

/**
 * Count items missing images
 */
export function countItemsMissingImages(menuData: MenuData): number {
  const allItems = getAllMenuItems(menuData);
  return allItems.filter(item => !item.imageUrl).length;
}

/**
 * Generate a report of items missing images
 */
export function generateMissingImagesReport(menuData: MenuData): {
  total: number;
  missing: number;
  items: Array<{ id: string; name: string; category: string }>;
} {
  const missingItems: Array<{ id: string; name: string; category: string }> = [];
  
  menuData.categories.forEach(category => {
    category.items.forEach(item => {
      if (!item.imageUrl) {
        missingItems.push({
          id: item.id,
          name: item.name,
          category: category.name,
        });
      }
    });
  });

  const allItems = getAllMenuItems(menuData);

  return {
    total: allItems.length,
    missing: missingItems.length,
    items: missingItems,
  };
}

/**
 * Example usage for build-time generation:
 * 
 * import menuData from '../data/sample/menu.json';
 * const updatedMenu = attachImagesToMenuData(menuData);
 * // Write updatedMenu back to menu.json
 */
