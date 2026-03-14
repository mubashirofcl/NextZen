import { getProductsRepository } from "./product.repository.js";

export const getProductsService = async (query) => {
  const {
    page = 1,
    limit = 10,
    isFeatured,
  } = query;


  const processedQuery = { ...query };

  if (isFeatured !== undefined) {
    processedQuery.isFeatured = isFeatured === 'true';
  }

  const { products, totalCount } = await getProductsRepository({
    ...processedQuery,
    page: Number(page),
    limit: Number(limit),
  });

  return {
    products,
    pagination: {
      totalProducts: totalCount,
      totalPages: Math.ceil(totalCount / Number(limit)),
      currentPage: Number(page),
      limit: Number(limit)
    }
  };
};