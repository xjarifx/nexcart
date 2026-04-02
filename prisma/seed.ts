import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { faker } from "@faker-js/faker";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  // Remove all data in dependency-safe order (children before parents).
  // We keep removing `RefreshToken` here to ensure users can be deleted cleanly;
  // we do not create any refresh tokens in this seed.
  await prisma.review.deleteMany(); // depends on user, product
  await prisma.orderItem.deleteMany(); // depends on order, product, shop
  await prisma.payment.deleteMany(); // depends on order
  await prisma.order.deleteMany(); // depends on user, address
  await prisma.cartItem.deleteMany(); // depends on cart, product
  await prisma.cart.deleteMany(); // depends on user
  await prisma.inventory.deleteMany(); // depends on product
  await prisma.product.deleteMany(); // depends on shop, category
  await prisma.category.deleteMany(); // can have parent/child
  await prisma.shop.deleteMany(); // depends on user
  await prisma.address.deleteMany(); // depends on user
  await prisma.refreshToken.deleteMany(); // depends on user
  await prisma.user.deleteMany();

  // Users
  const users = await Promise.all(
    Array.from({ length: 50 }).map(async () => {
      const plainPassword = faker.internet.password();
      return {
        id: faker.string.uuid(),
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: await bcrypt.hash(plainPassword, 12),
        phone: faker.phone.number(),
        createdAt: faker.date.past(),
      };
    }),
  );
  await prisma.user.createMany({ data: users });

  // Addresses
  const addresses = users.flatMap((u) =>
    Array.from({ length: faker.number.int({ min: 1, max: 2 }) }).map(() => ({
      id: faker.string.uuid(),
      userId: u.id,
      addressLine1: faker.location.streetAddress(),
      addressLine2: faker.location.secondaryAddress(),
      city: faker.location.city(),
      state: faker.location.state(),
      postalCode: faker.location.zipCode(),
      country: faker.location.country(),
      isDefault: false,
    })),
  );
  await prisma.address.createMany({ data: addresses });

  // Shops (assign a shop to some users)
  const shopOwners = faker.helpers.arrayElements(users, 8);
  const shops = shopOwners.map((owner, i) => ({
    id: faker.string.uuid(),
    ownerId: owner.id,
    name: `${owner.name.split(" ")[0]}'s Shop ${i + 1}`,
    slug: `shop-${owner.id.slice(0, 8)}-${i}`,
    description: faker.lorem.sentence(),
    status: faker.helpers.arrayElement(["PENDING", "ACTIVE", "SUSPENDED"]),
    createdAt: faker.date.past(),
  }));
  await prisma.shop.createMany({ data: shops });

  // Categories
  const categories = Array.from({ length: 10 }).map((_, i) => {
    const name = `${faker.commerce.department()} ${i}`;
    return {
      id: faker.string.uuid(),
      name,
      slug: `${name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")}-${i}`,
      parentId: null,
    };
  });
  await prisma.category.createMany({ data: categories });

  // Products
  const products = Array.from({ length: 30 }).map((_, idx) => {
    const category = faker.helpers.arrayElement(categories);
    const shop = faker.helpers.arrayElement(shops);
    const name = faker.commerce.productName();
    return {
      id: faker.string.uuid(),
      shopId: shop.id,
      categoryId: category.id,
      name,
      slug: `${name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")}-${idx}`,
      description: faker.commerce.productDescription(),
      price: parseFloat(faker.commerce.price({ min: 10, max: 500 })),
      brand: faker.company.name(),
      createdAt: faker.date.past(),
    };
  });
  await prisma.product.createMany({ data: products });

  // Inventory
  const inventory = products.map((p) => ({
    productId: p.id,
    stockQuantity: faker.number.int({ min: 0, max: 100 }),
  }));
  await prisma.inventory.createMany({ data: inventory });

  const stockByProductId = new Map(
    inventory.map((item) => [item.productId, item.stockQuantity]),
  );

  // Carts and CartItems
  const carts = users.map((u) => ({
    id: faker.string.uuid(),
    userId: u.id,
    createdAt: faker.date.past(),
  }));
  await prisma.cart.createMany({ data: carts });

  const cartItems = carts.flatMap((cart) => {
    const count = faker.number.int({ min: 1, max: 3 });
    const selected = faker.helpers.arrayElements(
      products,
      Math.min(count, products.length),
    );
    return selected.map((product) => ({
      quantity: faker.number.int({
        min: 1,
        max: Math.max(1, Math.min(5, stockByProductId.get(product.id) ?? 1)),
      }),
      id: faker.string.uuid(),
      cartId: cart.id,
      productId: product.id,
    }));
  });
  await prisma.cartItem.createMany({ data: cartItems });

  // Orders, OrderItems, Payments
  const orders = users.flatMap((u) =>
    Array.from({ length: faker.number.int({ min: 0, max: 2 }) }).map(() => {
      const userAddresses = addresses.filter((a) => a.userId === u.id);
      const address = faker.helpers.arrayElement(userAddresses) || addresses[0];
      return {
        id: faker.string.uuid(),
        userId: u.id,
        addressId: address.id,
        status: faker.helpers.arrayElement([
          "PENDING",
          "CONFIRMED",
          "SHIPPED",
          "DELIVERED",
          "CANCELLED",
        ]),
        totalAmount: parseFloat(faker.commerce.price({ min: 20, max: 1000 })),
        createdAt: faker.date.past(),
      };
    }),
  );
  await prisma.order.createMany({ data: orders });

  const orderItems = orders.flatMap((order) =>
    Array.from({ length: faker.number.int({ min: 1, max: 4 }) }).map(() => {
      const product = faker.helpers.arrayElement(products);
      return {
        id: faker.string.uuid(),
        orderId: order.id,
        productId: product.id,
        shopId: product.shopId,
        priceAtPurchase: product.price,
        quantity: faker.number.int({ min: 1, max: 3 }),
      };
    }),
  );
  await prisma.orderItem.createMany({ data: orderItems });

  const payments = orders
    .filter((order) =>
      ["CONFIRMED", "SHIPPED", "DELIVERED"].includes(order.status),
    )
    .map((order) => ({
      id: faker.string.uuid(),
      orderId: order.id,
      paymentMethod: faker.helpers.arrayElement(["card", "paypal", "bank"]),
      status:
        order.status === "DELIVERED" || order.status === "SHIPPED"
          ? "COMPLETED"
          : "PENDING",
      transactionId: faker.string.uuid(),
      createdAt: faker.date.past(),
    }));
  await prisma.payment.createMany({ data: payments });

  // Reviews: ensure each (userId, productId) pair is unique by selecting unique products per user
  const reviews = users.flatMap((u) => {
    const count = faker.number.int({ min: 0, max: 3 });
    const selected = faker.helpers.arrayElements(
      products,
      Math.min(count, products.length),
    );
    return selected.map((product) => ({
      id: faker.string.uuid(),
      userId: u.id,
      productId: product.id,
      rating: faker.number.int({ min: 1, max: 5 }),
      comment: faker.lorem.sentence(),
      createdAt: faker.date.past(),
    }));
  });
  await prisma.review.createMany({ data: reviews });

  console.log("Seeded all fake data!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
