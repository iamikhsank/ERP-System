// modules/10-dashboard.gs
function handleDashboardApi(action, payload) {
  if (action === 'getMetrics') {
    return successResponse({
      totalRevenue: 15000000,
      totalOrders: 120,
      activeUsers: 45
    });
  }
  return errorResponse('Action not found');
}
