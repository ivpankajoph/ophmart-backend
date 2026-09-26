import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

import { User } from '../models/User';
import { Category } from '../models/Category';
import { Brand } from '../models/Brand';
import { Product } from '../models/Product';
import { ProductVariant } from '../models/ProductVariant';
import { Review } from '../models/Review';
import { Coupon } from '../models/Coupon';
import { Banner } from '../models/Banner';

const seedData = async () => {
  try {
    const connUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ophmart';
    await mongoose.connect(connUri);
    console.log('[Seed] Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Category.deleteMany({}),
      Brand.deleteMany({}),
      Product.deleteMany({}),
      ProductVariant.deleteMany({}),
      Review.deleteMany({}),
      Coupon.deleteMany({}),
      Banner.deleteMany({})
    ]);
    console.log('[Seed] Cleaned existing collections');

    // 1. Create Users (Admin, Manager, Customers)
    const salt = await bcrypt.genSalt(10);
    const adminPassword = await bcrypt.hash('Admin@123456', salt);
    const customerPassword = await bcrypt.hash('Customer@123456', salt);

    const adminUser = await User.create({
      firstName: 'Alister',
      lastName: 'Vane',
      email: 'admin@ophmart.com',
      password: adminPassword,
      role: 'ADMIN',
      phone: '+91 9876543210',
      isEmailVerified: true,
      status: 'ACTIVE',
      addresses: [
        {
          fullName: 'Alister Vane',
          phone: '+91 9876543210',
          addressLine1: '42 Rue Saint-Honoré',
          city: 'Mumbai',
          state: 'Maharashtra',
          postalCode: '400001',
          country: 'India',
          isDefault: true
        }
      ]
    });

    const demoCustomer = await User.create({
      firstName: 'Elena',
      lastName: 'Rostova',
      email: 'customer@ophmart.com',
      password: customerPassword,
      role: 'CUSTOMER',
      phone: '+91 9811223344',
      isEmailVerified: true,
      status: 'ACTIVE',
      addresses: [
        {
          fullName: 'Elena Rostova',
          phone: '+91 9811223344',
          addressLine1: 'Penthouse 14B, Skyline Residency',
          addressLine2: 'Bandra West',
          city: 'Mumbai',
          state: 'Maharashtra',
          postalCode: '400050',
          country: 'India',
          isDefault: true
        }
      ]
    });

    console.log('[Seed] Created Admin & Customer users');

    // 2. Create Brands (10 brands)
    const brandData = [
      { name: 'Aurelius', slug: 'aurelius', originCountry: 'Italy', description: 'Tailored architectural menswear with Milanese heritage.', featured: true },
      { name: 'Maison Noir', slug: 'maison-noir', originCountry: 'France', description: 'Haute couture tailoring, monochromatic palettes and Parisian refinement.', featured: true },
      { name: 'Veloura', slug: 'veloura', originCountry: 'France', description: 'Fluid silhouettes and luxurious silk creations for contemporary elegance.', featured: true },
      { name: 'Monarque', slug: 'monarque', originCountry: 'Switzerland', description: 'Exceptional horology and precision crafted timepieces.', featured: true },
      { name: 'Atelier One', slug: 'atelier-one', originCountry: 'Japan', description: 'Minimalist craftsmanship, artisanal denim and raw selvedge perfection.', featured: true },
      { name: 'Urban Form', slug: 'urban-form', originCountry: 'United Kingdom', description: 'Structured outerwear, luxury technical knitwear and architectural cuts.', featured: true },
      { name: 'Élan', slug: 'elan', originCountry: 'Italy', description: 'Fine leather accessories and handcrafted Florentine footwear.', featured: true },
      { name: 'Vanta', slug: 'vanta', originCountry: 'Germany', description: 'Acoustic mastery and state of the art minimal audio devices.', featured: true },
      { name: 'Nova Luxe', slug: 'nova-luxe', originCountry: 'Sweden', description: 'Scandi-minimalist furniture and organic lighting sculptures.', featured: true },
      { name: 'Meridian', slug: 'meridian', originCountry: 'France', description: 'Artisanal fragrances and botanical skincare elixirs.', featured: true }
    ];

    const brands: Record<string, any> = {};
    for (const b of brandData) {
      brands[b.slug] = await Brand.create({
        ...b,
        logo: {
          public_id: `logo_${b.slug}`,
          secure_url: `https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=400`
        }
      });
    }
    console.log('[Seed] Created 10 luxury brands');

    // 3. Hierarchical Categories (8 Root categories, 14 subcategories)
    const rootCategoriesData = [
      { name: 'Women', slug: 'women', order: 1, image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1000' },
      { name: 'Men', slug: 'men', order: 2, image: 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?q=80&w=1000' },
      { name: 'Shoes', slug: 'shoes', order: 3, image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?q=80&w=1000' },
      { name: 'Bags', slug: 'bags', order: 4, image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=1000' },
      { name: 'Jewellery', slug: 'jewellery', order: 5, image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=1000' },
      { name: 'Beauty', slug: 'beauty', order: 6, image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=1000' },
      { name: 'Home', slug: 'home', order: 7, image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=1000' },
      { name: 'Electronics', slug: 'electronics', order: 8, image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1000' }
    ];

    const categories: Record<string, any> = {};
    for (const c of rootCategoriesData) {
      categories[c.slug] = await Category.create({
        name: c.name,
        slug: c.slug,
        level: 0,
        order: c.order,
        featured: true,
        image: { public_id: `cat_${c.slug}`, secure_url: c.image }
      });
    }

    const subCategoriesData = [
      { name: 'Dresses', slug: 'dresses', parent: 'women' },
      { name: 'Tops & Shirts', slug: 'women-tops', parent: 'women' },
      { name: 'Tailored Jackets', slug: 'women-jackets', parent: 'women' },
      { name: 'Shirts', slug: 'shirts', parent: 'men' },
      { name: 'Suits & Blazers', slug: 'men-blazers', parent: 'men' },
      { name: 'Trousers', slug: 'men-trousers', parent: 'men' },
      { name: 'Heels & Pumps', slug: 'heels', parent: 'shoes' },
      { name: 'Leather Sneakers', slug: 'sneakers', parent: 'shoes' },
      { name: 'Tote & Shoulder Bags', slug: 'shoulder-bags', parent: 'bags' },
      { name: 'Gold & Diamond', slug: 'fine-jewellery', parent: 'jewellery' },
      { name: 'Fragrance', slug: 'fragrance', parent: 'beauty' },
      { name: 'Designer Lighting', slug: 'lighting', parent: 'home' },
      { name: 'Luxury Throws & Vases', slug: 'decor', parent: 'home' },
      { name: 'Headphones & Audio', slug: 'audio', parent: 'electronics' }
    ];

    for (const sub of subCategoriesData) {
      categories[sub.slug] = await Category.create({
        name: sub.name,
        slug: sub.slug,
        parent: categories[sub.parent]._id,
        level: 1,
        featured: true
      });
    }
    console.log('[Seed] Created Categories and Subcategories hierarchy');

    // 4. Products Data (42 Realistic Luxury Products)
    const productCatalog = [
      // Men's
      {
        name: 'Italian Virgin Wool Tailored Blazer',
        slug: 'italian-virgin-wool-tailored-blazer',
        sku: 'OPH-BLZ-001',
        brand: 'aurelius',
        category: 'men',
        subCategory: 'men-blazers',
        gender: 'MEN',
        material: 'Italian Wool',
        price: 28999,
        compareAtPrice: 38999,
        colors: ['Charcoal', 'Midnight Navy', 'Onyx Black'],
        sizes: ['46', '48', '50', '52', '54'],
        collections: ['new-arrivals', 'best-sellers', 'premium-edit'],
        tags: ['tailoring', 'blazer', 'wool', 'luxury', 'formal'],
        featured: true,
        trending: true,
        bestSeller: true,
        newArrival: true,
        inventory: 45,
        ratings: 4.9,
        reviewsCount: 38,
        shortDescription: 'Constructed from lightweight virgin wool with a soft shoulder and double vents.',
        description: 'Meticulously crafted in our Biella atelier from 100% fine Italian virgin wool. Features hand-stitched pick detailing along the notch lapels, horn buttons, and a butterfly cupro lining for supreme breathability and ease of movement.',
        images: [
          'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=1200',
          'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1200',
          'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?q=80&w=1200'
        ]
      },
      {
        name: 'Oversized Silk Poplin Shirt',
        slug: 'oversized-silk-poplin-shirt',
        sku: 'OPH-SHT-002',
        brand: 'aurelius',
        category: 'men',
        subCategory: 'shirts',
        gender: 'MEN',
        material: 'Cotton Silk Blend',
        price: 11499,
        compareAtPrice: 15999,
        colors: ['Optic White', 'Sky Blue', 'Sand Beige'],
        sizes: ['S', 'M', 'L', 'XL'],
        collections: ['new-arrivals', 'essentials'],
        tags: ['shirt', 'poplin', 'oversized', 'minimalist'],
        featured: true,
        trending: true,
        newArrival: true,
        inventory: 60,
        ratings: 4.8,
        reviewsCount: 24,
        shortDescription: 'Modern fluid silhouette tailored from 120-thread count Egyptian cotton with pure mulberry silk.',
        description: 'A relaxed sartorial staple designed with dropped shoulders, elongated cuffs, mother-of-pearl buttons, and a clean concealed placket.',
        images: [
          'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=1200',
          'https://images.unsplash.com/photo-1620012253295-c15c429f66bf?q=80&w=1200'
        ]
      },
      {
        name: 'Pleated Wide-Leg Trousers',
        slug: 'pleated-wide-leg-trousers',
        sku: 'OPH-TRS-003',
        brand: 'atelier-one',
        category: 'men',
        subCategory: 'men-trousers',
        gender: 'MEN',
        material: 'Wool Linen Blend',
        price: 14999,
        compareAtPrice: 19999,
        colors: ['Oatmeal', 'Espresso', 'Black'],
        sizes: ['30', '32', '34', '36'],
        collections: ['trending', 'autumn-collection'],
        tags: ['trousers', 'pleated', 'linen', 'contemporary'],
        featured: false,
        trending: true,
        inventory: 30,
        ratings: 4.7,
        reviewsCount: 19,
        shortDescription: 'High-waisted double pleated trousers with a fluid drape and tapered hem.',
        description: 'Featuring bespoke side adjusters, deep single forward pleats, and a relaxed rise. Cut from breathable tropical-weight wool blended with Normandy linen.',
        images: [
          'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?q=80&w=1200',
          'https://images.unsplash.com/photo-1479064555552-3ef4979f8908?q=80&w=1200'
        ]
      },
      {
        name: 'Mongolian Cashmere Turtleneck',
        slug: 'mongolian-cashmere-turtleneck',
        sku: 'OPH-SWT-004',
        brand: 'urban-form',
        category: 'men',
        subCategory: 'shirts',
        gender: 'MEN',
        material: '100% Cashmere',
        price: 22499,
        compareAtPrice: 28999,
        colors: ['Camel', 'Cream', 'Charcoal'],
        sizes: ['S', 'M', 'L', 'XL'],
        collections: ['autumn-collection', 'premium-edit'],
        tags: ['cashmere', 'knitwear', 'sweater', 'winter'],
        featured: true,
        bestSeller: true,
        inventory: 25,
        ratings: 4.9,
        reviewsCount: 42,
        shortDescription: 'Spun from pure grade-A Mongolian cashmere with ribbed trims.',
        description: 'Exceptionally soft and insulating without bulk. Features ribbed roll neck, cuffs, and hem. Dry clean only.',
        images: [
          'https://images.unsplash.com/photo-1614676471928-2ed0ad1061a4?q=80&w=1200',
          'https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?q=80&w=1200'
        ]
      },
      {
        name: 'Heritage Trench Coat',
        slug: 'heritage-trench-coat',
        sku: 'OPH-COT-005',
        brand: 'maison-noir',
        category: 'men',
        subCategory: 'men-blazers',
        gender: 'MEN',
        material: 'Gabardine Cotton',
        price: 45999,
        compareAtPrice: 58000,
        colors: ['Honey Beige', 'Black'],
        sizes: ['48', '50', '52'],
        collections: ['new-arrivals', 'premium-edit'],
        tags: ['coat', 'outerwear', 'trench', 'iconic'],
        featured: true,
        trending: true,
        inventory: 15,
        ratings: 5.0,
        reviewsCount: 16,
        shortDescription: 'Double-breasted weatherproof gabardine trench coat with horn buckle belt.',
        description: 'Constructed from tightly woven weatherproof cotton gabardine developed to withstand seasonal elements while maintaining an immaculate sculptural silhouette.',
        images: [
          'https://images.unsplash.com/photo-1544923246-77307dd654cb?q=80&w=1200',
          'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=1200'
        ]
      },

      // Women's
      {
        name: 'Sculptural Backless Satin Evening Gown',
        slug: 'sculptural-backless-satin-evening-gown',
        sku: 'OPH-DRS-101',
        brand: 'veloura',
        category: 'women',
        subCategory: 'dresses',
        gender: 'WOMEN',
        material: 'Heavy Silk Satin',
        price: 36999,
        compareAtPrice: 48999,
        colors: ['Emerald Green', 'Champagne', 'Midnight Noir'],
        sizes: ['XS', 'S', 'M', 'L'],
        collections: ['new-arrivals', 'best-sellers', 'premium-edit'],
        tags: ['gown', 'dress', 'satin', 'evening', 'red-carpet'],
        featured: true,
        trending: true,
        bestSeller: true,
        newArrival: true,
        inventory: 20,
        ratings: 4.9,
        reviewsCount: 52,
        shortDescription: 'Floor-length heavy satin gown with a high halter neckline and plunging drape back.',
        description: 'An ode to classic Hollywood glamour reinterpreted through modern architectural minimalism. Bias-cut to accentuate curves effortlessly with a subtle pooling train.',
        images: [
          'https://images.unsplash.com/photo-1566174053879-31528523f8ae?q=80&w=1200',
          'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=1200',
          'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?q=80&w=1200'
        ]
      },
      {
        name: 'Asymmetric Tailored Wool Blazer Dress',
        slug: 'asymmetric-tailored-wool-blazer-dress',
        sku: 'OPH-DRS-102',
        brand: 'maison-noir',
        category: 'women',
        subCategory: 'dresses',
        gender: 'WOMEN',
        material: 'Virgin Wool',
        price: 24999,
        compareAtPrice: 32000,
        colors: ['Onyx Black', 'Ivory'],
        sizes: ['XS', 'S', 'M', 'L'],
        collections: ['trending', 'new-arrivals'],
        tags: ['blazer-dress', 'tailored', 'wool', 'couture'],
        featured: true,
        trending: true,
        inventory: 35,
        ratings: 4.8,
        reviewsCount: 31,
        shortDescription: 'Sharp peaked lapels meet an architectural wrap silhouette with satin trim.',
        description: 'Precision-tailored from compact wool crepe with sculpted shoulder pads, asymmetric button closure, and satin welt pockets.',
        images: [
          'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=1200',
          'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1200'
        ]
      },
      {
        name: 'Mulberry Silk Georgette Blouse',
        slug: 'mulberry-silk-georgette-blouse',
        sku: 'OPH-TOP-103',
        brand: 'veloura',
        category: 'women',
        subCategory: 'women-tops',
        gender: 'WOMEN',
        material: '100% Silk',
        price: 13499,
        compareAtPrice: 17999,
        colors: ['Pearl White', 'Blush Rose', 'Slate Grey'],
        sizes: ['XS', 'S', 'M', 'L'],
        collections: ['essentials', 'sale'],
        tags: ['silk', 'blouse', 'luxury', 'office'],
        featured: false,
        inventory: 50,
        ratings: 4.7,
        reviewsCount: 28,
        shortDescription: 'Fluid drape with a versatile pussy-bow necktie and concealed button front.',
        description: 'Woven from 16-momme pure mulberry silk georgette with a whisper-light texture and ethereal movement.',
        images: [
          'https://images.unsplash.com/photo-1551803091-e20673f15770?q=80&w=1200',
          'https://images.unsplash.com/photo-1564257631407-4deb1f99d992?q=80&w=1200'
        ]
      },
      {
        name: 'High-Waist Fluid Pleated Culottes',
        slug: 'high-waist-fluid-pleated-culottes',
        sku: 'OPH-TRS-104',
        brand: 'atelier-one',
        category: 'women',
        subCategory: 'women-jackets',
        gender: 'WOMEN',
        material: 'Viscose Crepe',
        price: 10999,
        compareAtPrice: 14500,
        colors: ['Terracotta', 'Black', 'Ecru'],
        sizes: ['XS', 'S', 'M', 'L'],
        collections: ['sale', 'summer-collection'],
        tags: ['culottes', 'trousers', 'pleated'],
        featured: false,
        inventory: 40,
        ratings: 4.6,
        reviewsCount: 17,
        shortDescription: 'Breezy wide silhouette mimicking an elegant midi skirt.',
        description: 'Cut with knife pleats extending from a structured waistband down to a sweeping mid-calf hemline.',
        images: [
          'https://images.unsplash.com/photo-1508427953056-b00b8d78ebf5?q=80&w=1200'
        ]
      },

      // Shoes
      {
        name: 'Florentine Leather Chelsea Boots',
        slug: 'florentine-leather-chelsea-boots',
        sku: 'OPH-SHO-201',
        brand: 'elan',
        category: 'shoes',
        subCategory: 'sneakers',
        gender: 'MEN',
        material: 'Full Grain Calfskin',
        price: 21999,
        compareAtPrice: 28999,
        colors: ['Cognac Brown', 'Matte Black'],
        sizes: ['40', '41', '42', '43', '44', '45'],
        collections: ['best-sellers', 'autumn-collection'],
        tags: ['boots', 'chelsea', 'leather', 'handcrafted'],
        featured: true,
        bestSeller: true,
        inventory: 35,
        ratings: 4.9,
        reviewsCount: 45,
        shortDescription: 'Goodyear welted Tuscan calfskin leather boot with elasticated gore and pull tabs.',
        description: 'Handmade in Tuscany using vegetable-tanned full-grain leather that burnishes beautifully with age. Vibram rubber half-sole for traction and durability.',
        images: [
          'https://images.unsplash.com/photo-1638247025967-b4e38f787b76?q=80&w=1200',
          'https://images.unsplash.com/photo-1520639888713-7851133b1ed0?q=80&w=1200'
        ]
      },
      {
        name: 'Minimalist Clean Court Sneakers',
        slug: 'minimalist-clean-court-sneakers',
        sku: 'OPH-SHO-202',
        brand: 'atelier-one',
        category: 'shoes',
        subCategory: 'sneakers',
        gender: 'UNISEX',
        material: 'Nappa Leather',
        price: 16999,
        compareAtPrice: 22000,
        colors: ['All White', 'White/Gum', 'Black/White'],
        sizes: ['38', '39', '40', '41', '42', '43', '44'],
        collections: ['new-arrivals', 'essentials'],
        tags: ['sneakers', 'leather', 'minimal', 'court'],
        featured: true,
        trending: true,
        inventory: 50,
        ratings: 4.8,
        reviewsCount: 62,
        shortDescription: 'Stripped-back luxury low-top sneaker in smooth Italian nappa leather.',
        description: 'Featuring gold foil serial stamp on the heel, memory foam footbed, and stitched Margom rubber sole.',
        images: [
          'https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=1200',
          'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=1200'
        ]
      },
      {
        name: 'Slingback Pointed Toe Silk Pumps',
        slug: 'slingback-pointed-toe-silk-pumps',
        sku: 'OPH-SHO-203',
        brand: 'veloura',
        category: 'shoes',
        subCategory: 'heels',
        gender: 'WOMEN',
        material: 'Duchess Satin',
        price: 19499,
        compareAtPrice: 26000,
        colors: ['Noir', 'Burgundy', 'Champagne'],
        sizes: ['36', '37', '38', '39', '40'],
        collections: ['trending', 'premium-edit'],
        tags: ['heels', 'pumps', 'slingback', 'evening'],
        featured: true,
        inventory: 28,
        ratings: 4.8,
        reviewsCount: 33,
        shortDescription: '85mm stiletto heel with an elongated pointed toe and crystal buckle slingback.',
        description: 'Covered in lustrous Italian duchess satin, lined in soft kidskin, and supported by a comfortable padded arch support.',
        images: [
          'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?q=80&w=1200',
          'https://images.unsplash.com/photo-1515347619252-60a4bf4fff4f?q=80&w=1200'
        ]
      },

      // Bags
      {
        name: 'The Monolith Structured Leather Tote',
        slug: 'the-monolith-structured-leather-tote',
        sku: 'OPH-BAG-301',
        brand: 'elan',
        category: 'bags',
        subCategory: 'shoulder-bags',
        gender: 'UNISEX',
        material: 'Palmellato Leather',
        price: 34999,
        compareAtPrice: 45000,
        colors: ['Cognac', 'Onyx', 'Taupe'],
        sizes: ['Medium', 'Large'],
        collections: ['best-sellers', 'essentials', 'premium-edit'],
        tags: ['bag', 'tote', 'leather', 'workbag', 'everyday'],
        featured: true,
        bestSeller: true,
        newArrival: false,
        inventory: 24,
        ratings: 4.9,
        reviewsCount: 57,
        shortDescription: 'Architectural everyday tote spacious enough for a 16" laptop and daily essentials.',
        description: 'Hand-finished edge painting, palladium hardware, micro-suede lining, and an internal zipped security compartment.',
        images: [
          'https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=1200',
          'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=1200'
        ]
      },
      {
        name: 'Curved Half-Moon Shoulder Bag',
        slug: 'curved-half-moon-shoulder-bag',
        sku: 'OPH-BAG-302',
        brand: 'maison-noir',
        category: 'bags',
        subCategory: 'shoulder-bags',
        gender: 'WOMEN',
        material: 'Smooth Box Calf',
        price: 27999,
        compareAtPrice: 35000,
        colors: ['Burgundy Wine', 'Jet Black', 'Bone White'],
        sizes: ['One Size'],
        collections: ['trending', 'new-arrivals'],
        tags: ['bag', 'shoulder-bag', 'minimalist', 'half-moon'],
        featured: true,
        trending: true,
        inventory: 30,
        ratings: 4.9,
        reviewsCount: 41,
        shortDescription: 'Sculpted crescent silhouette with an adjustable strap and discreet magnetic snap.',
        description: 'Immaculately proportioned with smooth box leather that holds its sculptural curve with effortless distinction.',
        images: [
          'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?q=80&w=1200',
          'https://images.unsplash.com/photo-1591561954557-26941169b49e?q=80&w=1200'
        ]
      },

      // Watches & Jewellery
      {
        name: 'Monarque Chrono Royal 41mm',
        slug: 'monarque-chrono-royal-41mm',
        sku: 'OPH-WCH-401',
        brand: 'monarque',
        category: 'jewellery',
        subCategory: 'fine-jewellery',
        gender: 'UNISEX',
        material: '316L Stainless Steel',
        price: 89999,
        compareAtPrice: 115000,
        colors: ['Sunburst Silver', 'Deep Navy', 'Obsidian Black'],
        sizes: ['41mm'],
        collections: ['best-sellers', 'premium-edit'],
        tags: ['watch', 'chronograph', 'automatic', 'horology', 'swiss'],
        featured: true,
        bestSeller: true,
        inventory: 12,
        ratings: 5.0,
        reviewsCount: 29,
        shortDescription: 'Swiss automatic chronograph movement with 48h power reserve and sapphire crystal glass.',
        description: 'Water resistant to 100 meters, integrated H-link bracelet with butterfly deployment clasp, exhibition caseback revealing the rotor.',
        images: [
          'https://images.unsplash.com/photo-1524805444758-089113d48a6d?q=80&w=1200',
          'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=1200'
        ]
      },
      {
        name: '18K Solid Gold Serpent Ring',
        slug: '18k-solid-gold-serpent-ring',
        sku: 'OPH-JWL-402',
        brand: 'veloura',
        category: 'jewellery',
        subCategory: 'fine-jewellery',
        gender: 'WOMEN',
        material: '18K Yellow Gold',
        price: 42999,
        compareAtPrice: 55000,
        colors: ['Yellow Gold', 'White Gold'],
        sizes: ['6', '7', '8'],
        collections: ['new-arrivals', 'premium-edit'],
        tags: ['ring', 'gold', 'jewellery', 'serpent'],
        featured: true,
        inventory: 18,
        ratings: 4.9,
        reviewsCount: 19,
        shortDescription: 'Hand-engraved scales with bezel-set emerald eyes.',
        description: 'Cast in 18-karat recycled yellow gold, celebrating timeless mythological symbolism with delicate modern execution.',
        images: [
          'https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=1200',
          'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=1200'
        ]
      },

      // Electronics
      {
        name: 'Vanta Acoustic Studio Over-Ear Headphones',
        slug: 'vanta-acoustic-studio-over-ear-headphones',
        sku: 'OPH-ELC-501',
        brand: 'vanta',
        category: 'electronics',
        subCategory: 'audio',
        gender: 'ELECTRONICS',
        material: 'Anodized Aluminum & Lambskin',
        price: 38999,
        compareAtPrice: 49999,
        colors: ['Matte Black', 'Silver Moon', 'Sand'],
        sizes: ['One Size'],
        collections: ['best-sellers', 'premium-edit', 'trending'],
        tags: ['headphones', 'audio', 'anc', 'wireless', 'audiophile'],
        featured: true,
        bestSeller: true,
        trending: true,
        inventory: 40,
        ratings: 4.9,
        reviewsCount: 76,
        shortDescription: 'Custom 40mm titanium drivers, active noise cancellation, and 38-hour battery longevity.',
        description: 'Engineered in Berlin with tactile rotary controls, replaceable memory foam ear cushions in French lambskin, and aptX HD lossless Bluetooth audio.',
        images: [
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1200',
          'https://images.unsplash.com/photo-1583394838336-acd977736f90?q=80&w=1200'
        ]
      },
      {
        name: 'Vanta Minimalist Smart Desk Speaker',
        slug: 'vanta-minimalist-smart-desk-speaker',
        sku: 'OPH-ELC-502',
        brand: 'vanta',
        category: 'electronics',
        subCategory: 'audio',
        gender: 'ELECTRONICS',
        material: 'Cast Concrete & Walnut',
        price: 26999,
        compareAtPrice: 34000,
        colors: ['Concrete Grey', 'Smoked Walnut'],
        sizes: ['Compact'],
        collections: ['trending'],
        tags: ['speaker', 'bluetooth', 'design', 'audio'],
        featured: false,
        trending: true,
        inventory: 25,
        ratings: 4.8,
        reviewsCount: 22,
        shortDescription: 'Room-filling spatial audio in an acoustic resonance enclosure made of architectural concrete.',
        description: 'Features high-resolution streaming, multi-room sync, and bespoke fabric grille from Kvadrat.',
        images: [
          'https://images.unsplash.com/photo-1545454675-3531b543be5d?q=80&w=1200'
        ]
      },

      // Home & Living
      {
        name: 'Sculptural Travertine Column Table Lamp',
        slug: 'sculptural-travertine-column-table-lamp',
        sku: 'OPH-HOM-601',
        brand: 'nova-luxe',
        category: 'home',
        subCategory: 'lighting',
        gender: 'HOME',
        material: 'Roman Travertine Stone',
        price: 24999,
        compareAtPrice: 32000,
        colors: ['Honed Travertine', 'Nero Marquina'],
        sizes: ['Standard'],
        collections: ['trending', 'new-arrivals'],
        tags: ['lamp', 'travertine', 'lighting', 'interior'],
        featured: true,
        inventory: 20,
        ratings: 4.9,
        reviewsCount: 18,
        shortDescription: 'Solid natural travertine cylinder with an opal glass sphere diffuser.',
        description: 'Each piece features unique porous veins carved from single block stone. Dimmable warm 2700K illumination.',
        images: [
          'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=1200',
          'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=1200'
        ]
      },
      {
        name: 'Artisanal Fluted Ceramic Amphora Vase',
        slug: 'artisanal-fluted-ceramic-amphora-vase',
        sku: 'OPH-HOM-602',
        brand: 'nova-luxe',
        category: 'home',
        subCategory: 'decor',
        gender: 'HOME',
        material: 'Glazed Stoneware',
        price: 8499,
        compareAtPrice: 12000,
        colors: ['Terracotta Chalk', 'Matte Chalk White'],
        sizes: ['Medium', 'Large'],
        collections: ['essentials'],
        tags: ['vase', 'ceramic', 'decor', 'artisan'],
        featured: false,
        inventory: 40,
        ratings: 4.7,
        reviewsCount: 15,
        shortDescription: 'Hand-thrown fluted ceramic urn with a weathered mineral glaze.',
        description: 'Created by master potters using traditional wood firing techniques for organic, tactile depth.',
        images: [
          'https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?q=80&w=1200'
        ]
      },

      // Beauty & Fragrance
      {
        name: 'Bois De Santal Eau De Parfum 100ml',
        slug: 'bois-de-santal-eau-de-parfum-100ml',
        sku: 'OPH-BTY-701',
        brand: 'meridian',
        category: 'beauty',
        subCategory: 'fragrance',
        gender: 'UNISEX',
        material: 'Essential Oils',
        price: 15999,
        compareAtPrice: 19999,
        colors: ['Amber Glass'],
        sizes: ['100ml', '50ml'],
        collections: ['best-sellers', 'new-arrivals', 'premium-edit'],
        tags: ['perfume', 'fragrance', 'sandalwood', 'niche', 'scent'],
        featured: true,
        bestSeller: true,
        inventory: 50,
        ratings: 5.0,
        reviewsCount: 84,
        shortDescription: 'Notes of Australian sandalwood, cardamom, violet leaves, Tuscan leather and smoky papyrus.',
        description: 'A cult fragrance formulated with high concentration pure perfume oils and aged in glass vessels.',
        images: [
          'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=1200',
          'https://images.unsplash.com/photo-1523293182086-7651a899d37f?q=80&w=1200'
        ]
      }
    ];

    // Add extra items to hit 40+ products across all luxury categories
    const additionalTemplates = [
      { name: 'Merino Wool Ribbed Cardigan', brand: 'aurelius', cat: 'men', sub: 'shirts', price: 16999, img: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=1200' },
      { name: 'Raw Selvedge 14oz Denim Jean', brand: 'atelier-one', cat: 'men', sub: 'men-trousers', price: 12999, img: 'https://images.unsplash.com/photo-1542272604-780c96856592?q=80&w=1200' },
      { name: 'Leather Flight Bomber Jacket', brand: 'maison-noir', cat: 'men', sub: 'men-blazers', price: 39999, img: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=1200' },
      { name: 'Cuban Collar Linen Vacation Shirt', brand: 'aurelius', cat: 'men', sub: 'shirts', price: 8999, img: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=1200' },
      { name: 'Double Breasted Cashmere Overcoat', brand: 'aurelius', cat: 'men', sub: 'men-blazers', price: 54999, img: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=1200' },
      { name: 'Silk Slip Dress in Vintage Bronze', brand: 'veloura', cat: 'women', sub: 'dresses', price: 18999, img: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?q=80&w=1200' },
      { name: 'Pleated Chiffon Maxi Skirt', brand: 'veloura', cat: 'women', sub: 'dresses', price: 14499, img: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?q=80&w=1200' },
      { name: 'Double-Faced Wool Belted Coat', brand: 'maison-noir', cat: 'women', sub: 'women-jackets', price: 41999, img: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1200' },
      { name: 'Ribbed Knit Cashmere Midi Dress', brand: 'veloura', cat: 'women', sub: 'dresses', price: 21999, img: 'https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?q=80&w=1200' },
      { name: 'Tailored Wide-Leg Silk Trousers', brand: 'maison-noir', cat: 'women', sub: 'women-jackets', price: 16999, img: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?q=80&w=1200' },
      { name: 'Square Toe Leather Ankle Boot', brand: 'elan', cat: 'shoes', sub: 'heels', price: 24999, img: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?q=80&w=1200' },
      { name: 'Hand-Stitched Penny Loafers', brand: 'elan', cat: 'shoes', sub: 'sneakers', price: 18999, img: 'https://images.unsplash.com/photo-1533867617858-e7b97e060509?q=80&w=1200' },
      { name: 'Strappy Metallic Leather Stilettos', brand: 'veloura', cat: 'shoes', sub: 'heels', price: 21499, img: 'https://images.unsplash.com/photo-1581101767113-1677fc2beaa8?q=80&w=1200' },
      { name: 'Quilted Leather Camera Bag', brand: 'maison-noir', cat: 'bags', sub: 'shoulder-bags', price: 23999, img: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=1200' },
      { name: 'Minimal Leather Crossbody Pouch', brand: 'elan', cat: 'bags', sub: 'shoulder-bags', price: 12999, img: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?q=80&w=1200' },
      { name: 'Woven Raffia Summer Tote', brand: 'veloura', cat: 'bags', sub: 'shoulder-bags', price: 17499, img: 'https://images.unsplash.com/photo-1591561954557-26941169b49e?q=80&w=1200' },
      { name: '18K Gold Link Chain Necklace', brand: 'veloura', cat: 'jewellery', sub: 'fine-jewellery', price: 34999, img: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=1200' },
      { name: 'Tahitian Black Pearl Drop Earrings', brand: 'veloura', cat: 'jewellery', sub: 'fine-jewellery', price: 28999, img: 'https://images.unsplash.com/photo-1630019852942-f89202989a59?q=80&w=1200' },
      { name: 'Titanium Smart Fitness Ring', brand: 'vanta', cat: 'electronics', sub: 'audio', price: 24999, img: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=1200' },
      { name: 'Wireless Charging Stone Pad', brand: 'vanta', cat: 'electronics', sub: 'audio', price: 7999, img: 'https://images.unsplash.com/photo-1586105251261-72a756497a11?q=80&w=1200' },
      { name: 'Vanta True-Wireless Lossless ANC Earbuds', brand: 'vanta', cat: 'electronics', sub: 'audio', price: 18999, img: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?q=80&w=1200' },
      { name: 'Precision Anodized Aluminum Keyboard', brand: 'vanta', cat: 'electronics', sub: 'audio', price: 22499, img: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?q=80&w=1200' },
      { name: 'Minimalist Ambient Smart Desk Clock', brand: 'vanta', cat: 'electronics', sub: 'audio', price: 11999, img: 'https://images.unsplash.com/photo-1508057198894-247b23fe5ade?q=80&w=1200' },
      { name: 'Wabi-Sabi Stoneware Dinner Set', brand: 'nova-luxe', cat: 'home', sub: 'decor', price: 18999, img: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=1200' },
      { name: 'Pure Belgian Linen Duvet Cover Set', brand: 'nova-luxe', cat: 'home', sub: 'decor', price: 21999, img: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?q=80&w=1200' },
      { name: 'Rose De Mai Body Crème', brand: 'meridian', cat: 'beauty', sub: 'fragrance', price: 6499, img: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=1200' },
      { name: 'Velvet Rouge Matte Lipstick', brand: 'meridian', cat: 'beauty', sub: 'fragrance', price: 3999, img: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?q=80&w=1200' },
      { name: 'Luminous Silk Radiant Foundation', brand: 'meridian', cat: 'beauty', sub: 'fragrance', price: 6999, img: 'https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?q=80&w=1200' },
      { name: '24K Gold Cellular Rejuvenating Serum', brand: 'meridian', cat: 'beauty', sub: 'fragrance', price: 14999, img: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=1200' },
      { name: 'Obsidian Smoky Kohl Eyeshadow Palette', brand: 'meridian', cat: 'beauty', sub: 'fragrance', price: 8499, img: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?q=80&w=1200' }
    ];

    for (let i = 0; i < additionalTemplates.length; i++) {
      const item = additionalTemplates[i];
      const slug = item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      productCatalog.push({
        name: item.name,
        slug,
        sku: `OPH-LUX-${100 + i}`,
        brand: item.brand,
        category: item.cat,
        subCategory: item.sub,
        gender: item.cat === 'men' ? 'MEN' : item.cat === 'women' ? 'WOMEN' : 'UNISEX',
        material: 'Premium Material',
        price: item.price,
        compareAtPrice: Math.round(item.price * 1.3),
        colors: ['Black', 'Ivory', 'Beige'],
        sizes: item.cat === 'shoes' ? ['40', '41', '42', '43'] : ['S', 'M', 'L'],
        collections: ['new-arrivals', 'trending'],
        tags: [item.cat, 'luxury', 'editorial'],
        featured: i % 3 === 0,
        trending: i % 2 === 0,
        bestSeller: i % 4 === 0,
        newArrival: true,
        inventory: 20 + i,
        ratings: 4.8,
        reviewsCount: 12 + i,
        shortDescription: `Curated luxury piece defining the new season in modern fashion.`,
        description: `Exquisitely engineered and finished with artisanal precision. Designed for discerning individuals who appreciate quiet luxury and enduring craftsmanship.`,
        images: [item.img]
      });
    }

    console.log(`[Seed] Prepared ${productCatalog.length} products`);

    // Insert Products and their Variants
    for (const p of productCatalog) {
      const brandDoc = brands[p.brand];
      const catDoc = categories[p.category];
      const subCatDoc = categories[p.subCategory];

      const product = await Product.create({
        name: p.name,
        slug: p.slug,
        sku: p.sku,
        description: p.description,
        shortDescription: p.shortDescription,
        brand: brandDoc?._id || brands['aurelius']._id,
        category: catDoc?._id || categories['women']._id,
        subCategory: subCatDoc?._id,
        gender: p.gender as any,
        material: p.material,
        price: p.price,
        compareAtPrice: p.compareAtPrice,
        salePrice: p.price,
        inventory: p.inventory,
        ratings: p.ratings,
        reviewsCount: p.reviewsCount,
        colors: p.colors,
        sizes: p.sizes,
        collections: p.collections,
        tags: p.tags,
        featured: p.featured,
        trending: p.trending,
        newArrival: p.newArrival,
        bestSeller: p.bestSeller,
        status: 'PUBLISHED',
        images: p.images.map((url, idx) => ({
          public_id: `${p.slug}_img_${idx}`,
          secure_url: url,
          width: 1200,
          height: 1500
        })),
        details: {
          fit: 'True to luxury European sizing.',
          origin: brandDoc?.originCountry || 'Italy',
          careInstructions: ['Specialist dry clean only', 'Do not tumble dry', 'Store in breathable garment bag'],
          highlights: ['Artisanal construction', 'Sustainably sourced fibers', 'Limited production run']
        },
        seo: {
          title: `${p.name} | OPHMNART Luxury`,
          description: p.shortDescription,
          keywords: [p.name, p.brand, 'luxury fashion', 'ophmart']
        }
      });

      // Create variants
      const variantIds = [];
      for (const color of p.colors.slice(0, 2)) {
        for (const size of p.sizes.slice(0, 3)) {
          const v = await ProductVariant.create({
            product: product._id,
            sku: `${product.sku}-${color.slice(0, 3).toUpperCase()}-${size}`,
            color,
            size,
            price: product.price,
            salePrice: product.salePrice,
            stock: Math.floor(Math.random() * 15) + 5,
            images: product.images
          });
          variantIds.push(v._id);
        }
      }
      product.variants = variantIds as any;
      await product.save();
    }
    console.log('[Seed] Populated all products and variants');

    // 5. Create Reviews for first 5 products
    const sampleProducts = await Product.find().limit(5);
    for (const prod of sampleProducts) {
      await Review.create({
        product: prod._id,
        user: demoCustomer._id,
        userName: 'Elena Rostova',
        rating: 5,
        title: 'Impeccable cut and fabric quality',
        comment: 'The craftsmanship exceeded my expectations. The weight of the fabric and the drape are unmatched. Arrived in bespoke luxury packaging within 2 days.',
        verifiedPurchase: true,
        helpfulCount: 8,
        status: 'APPROVED'
      });
      await Review.create({
        product: prod._id,
        user: adminUser._id,
        userName: 'Marcus Sterling',
        rating: 5,
        title: 'Pure quiet luxury',
        comment: 'Understated elegance at its finest. Worth every rupee for the tailored precision.',
        verifiedPurchase: true,
        helpfulCount: 4,
        status: 'APPROVED'
      });
    }
    console.log('[Seed] Created verified customer reviews');

    // 6. Create Coupons
    const couponsData = [
      { code: 'WELCOME10', type: 'PERCENTAGE', value: 10, minimumPurchase: 5000, maximumDiscount: 2500, endDate: new Date('2027-12-31') },
      { code: 'LUXE20', type: 'PERCENTAGE', value: 20, minimumPurchase: 20000, maximumDiscount: 10000, endDate: new Date('2027-12-31') },
      { code: 'VIP5000', type: 'FIXED', value: 5000, minimumPurchase: 35000, endDate: new Date('2027-12-31') },
      { code: 'FREESHIP', type: 'FREE_SHIPPING', value: 499, minimumPurchase: 0, endDate: new Date('2027-12-31') }
    ];

    for (const c of couponsData) {
      await Coupon.create({ ...c, status: 'ACTIVE' });
    }
    console.log('[Seed] Created active discount coupons');

    // 7. Create CMS Banners
    const bannersData = [
      {
        title: 'THE NEW SEASON',
        subtitle: 'Defined by simplicity. Designed for now.',
        image: {
          public_id: 'banner_hero_autumn',
          secure_url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2000'
        },
        ctaText: 'DISCOVER COLLECTION',
        ctaLink: '/collections/new-arrivals',
        type: 'HERO',
        priority: 1
      },
      {
        title: 'THE ART OF EVERYDAY',
        subtitle: 'Discover pieces designed for modern living.',
        image: {
          public_id: 'banner_editorial_art',
          secure_url: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=2000'
        },
        ctaText: 'EXPLORE THE EDIT',
        ctaLink: '/collections/premium-edit',
        type: 'EDITORIAL',
        priority: 2
      },
      {
        title: 'PRIVATE ARCHIVE SALE',
        subtitle: 'Curated styles up to 40% off for members.',
        image: {
          public_id: 'banner_promo_sale',
          secure_url: 'https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=2000'
        },
        ctaText: 'SHOP PRIVATE SALE',
        ctaLink: '/collections/sale',
        type: 'PROMO',
        priority: 3
      }
    ];

    for (const b of bannersData) {
      await Banner.create({ ...b, status: 'ACTIVE' });
    }
    console.log('[Seed] Created CMS Banners');

    console.log('=========================================');
    console.log('  OPHMNART DATABASE SEEDED SUCCESSFULLY! ');
    console.log('  Admin User:    admin@ophmart.com        ');
    console.log('  Admin Pass:    Admin@123456             ');
    console.log('  Customer User: customer@ophmart.com     ');
    console.log('  Customer Pass: Customer@123456          ');
    console.log('=========================================');

    process.exit(0);
  } catch (error) {
    console.error('[Seed] Error during seeding:', error);
    process.exit(1);
  }
};

seedData();
