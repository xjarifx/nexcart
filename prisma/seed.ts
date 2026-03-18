import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { faker } from "@faker-js/faker";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  // Remove all data in correct order
  await prisma.review.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.address.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  // Categories
  const categories = Array.from({ length: 10 }).map((_, i) => ({
    id: faker.string.uuid(),
    name: faker.commerce.department() + i,
    parentId: i < 2 ? null : undefined, // first 2 are root
  }));
  await prisma.category.createMany({ data: categories });

  // Products
  const products = Array.from({ length: 30 }).map(() => {
    const category = faker.helpers.arrayElement(categories);
    return {
      id: faker.string.uuid(),
      name: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      price: parseFloat(faker.commerce.price({ min: 10, max: 500 })),
      categoryId: category.id,
      brand: faker.company.name(),
      createdAt: faker.date.past(),
    };
  });
  await prisma.product.createMany({ data: products });

  // Inventory
  const inventory = products.map((p) => ({
    productId: p.id,
    stockQuantity: faker.number.int({ min: 0, max: 100 }),
    reservedQuantity: faker.number.int({ min: 0, max: 10 }),
  }));
  await prisma.inventory.createMany({ data: inventory });

  // Users
  const users = Array.from({ length: 50 }).map(() => ({
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    email: faker.internet.email(),
    passwordHash: faker.internet.password(),
    phone: faker.phone.number(),
    createdAt: faker.date.past(),
  }));
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

  // Carts and CartItems
  const carts = users.map((u) => ({
    id: faker.string.uuid(),
    userId: u.id,
    createdAt: faker.date.past(),
  }));
  await prisma.cart.createMany({ data: carts });

  const cartItems = carts.flatMap((cart) =>
    Array.from({ length: faker.number.int({ min: 1, max: 3 }) }).map(() => {
      const product = faker.helpers.arrayElement(products);
      return {
        id: faker.string.uuid(),
        cartId: cart.id,
        productId: product.id,
        quantity: faker.number.int({ min: 1, max: 5 }),
      };
    }),
  );
  await prisma.cartItem.createMany({ data: cartItems });

  // Orders, OrderItems, Payments
  const orders = users.flatMap((u) =>
    Array.from({ length: faker.number.int({ min: 0, max: 2 }) }).map(() => ({
      id: faker.string.uuid(),
      userId: u.id,
      status: faker.helpers.arrayElement([
        "pending",
        "paid",
        "shipped",
        "delivered",
      ]),
      totalAmount: parseFloat(faker.commerce.price({ min: 20, max: 1000 })),
      createdAt: faker.date.past(),
    })),
  );
  await prisma.order.createMany({ data: orders });

  const orderItems = orders.flatMap((order) =>
    Array.from({ length: faker.number.int({ min: 1, max: 4 }) }).map(() => {
      const product = faker.helpers.arrayElement(products);
      return {
        id: faker.string.uuid(),
        orderId: order.id,
        productId: product.id,
        priceAtPurchase: product.price,
        quantity: faker.number.int({ min: 1, max: 3 }),
      };
    }),
  );
  await prisma.orderItem.createMany({ data: orderItems });

  const payments = orders.map((order) => ({
    id: faker.string.uuid(),
    orderId: order.id,
    paymentMethod: faker.helpers.arrayElement(["card", "paypal", "bank"]),
    status: faker.helpers.arrayElement(["pending", "completed", "failed"]),
    transactionId: faker.string.uuid(),
    createdAt: faker.date.past(),
  }));
  await prisma.payment.createMany({ data: payments });

  // Reviews
  const reviews = Array.from({ length: 50 }).map(() => {
    const user = faker.helpers.arrayElement(users);
    const product = faker.helpers.arrayElement(products);
    return {
      id: faker.string.uuid(),
      userId: user.id,
      productId: product.id,
      rating: faker.number.int({ min: 1, max: 5 }),
      comment: faker.lorem.sentence(),
      createdAt: faker.date.past(),
    };
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
