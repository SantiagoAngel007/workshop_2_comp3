import { Subscription } from './subscription.entity';

describe('Subscription Entity', () => {
  let subscription: Subscription;
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com'
  };

  beforeEach(() => {
    subscription = new Subscription();
    subscription.id = 'subscription-123';
    subscription.name = 'Gold Subscription';
    subscription.cost = 199.99;
    subscription.max_classes_assistance = 12;
    subscription.max_gym_assistance = 30;
    subscription.duration_months = 1;
    subscription.purchase_date = new Date('2025-10-27');
    subscription.isActive = true;
    subscription.created_at = new Date('2025-10-27T10:00:00Z');
    subscription.updated_at = new Date('2025-10-27T10:00:00Z');
    subscription.user = mockUser;
    subscription.memberships = [];
  });

  it('should create a subscription entity', () => {
    expect(subscription).toBeDefined();
    expect(subscription.id).toBe('subscription-123');
    expect(subscription.name).toBe('Gold Subscription');
    expect(subscription.cost).toBe(199.99);
    expect(subscription.isActive).toBe(true);
  });

  it('should handle subscription limits correctly', () => {
    expect(subscription.max_classes_assistance).toBe(12);
    expect(subscription.max_gym_assistance).toBe(30);
    expect(subscription.duration_months).toBe(1);
  });

  it('should handle activation status changes', () => {
    subscription.isActive = false;
    expect(subscription.isActive).toBe(false);
    
    subscription.isActive = true;
    expect(subscription.isActive).toBe(true);
  });

  it('should handle cost updates', () => {
    subscription.cost = 299.99;
    expect(subscription.cost).toBe(299.99);
    
    subscription.cost = 0;
    expect(subscription.cost).toBe(0);
  });

  it('should handle duration updates', () => {
    subscription.duration_months = 6;
    expect(subscription.duration_months).toBe(6);

    subscription.duration_months = 12;
    expect(subscription.duration_months).toBe(12);
  });

  it('should handle assistance limit updates', () => {
    subscription.max_classes_assistance = 24;
    subscription.max_gym_assistance = 60;

    expect(subscription.max_classes_assistance).toBe(24);
    expect(subscription.max_gym_assistance).toBe(60);
  });

  it('should handle user relationship', () => {
    expect(subscription.user).toBeDefined();
    expect(subscription.user.id).toBe('user-123');
    expect(subscription.user.email).toBe('test@example.com');
    
    const newUser = {
      id: 'user-456',
      email: 'new@example.com'
    };
    subscription.user = newUser;
    expect(subscription.user.id).toBe('user-456');
  });

  it('should handle memberships relationship', () => {
    const mockMemberships = [
      { id: 'membership-1', name: 'Basic' },
      { id: 'membership-2', name: 'Premium' }
    ];

    subscription.memberships = mockMemberships;
    expect(subscription.memberships).toHaveLength(2);
    expect(subscription.memberships[0].id).toBe('membership-1');
    expect(subscription.memberships[1].name).toBe('Premium');
  });

  it('should track timestamps correctly', () => {
    const createdDate = new Date('2025-10-27T10:00:00Z');
    const updatedDate = new Date('2025-10-27T11:00:00Z');

    subscription.created_at = createdDate;
    subscription.updated_at = updatedDate;

    expect(subscription.created_at).toEqual(createdDate);
    expect(subscription.updated_at).toEqual(updatedDate);
  });

  it('should handle purchase date updates', () => {
    const newPurchaseDate = new Date('2025-11-01');
    subscription.purchase_date = newPurchaseDate;
    expect(subscription.purchase_date).toEqual(newPurchaseDate);
  });

  it('should allow name updates', () => {
    subscription.name = 'Premium Gold Subscription';
    expect(subscription.name).toBe('Premium Gold Subscription');

    subscription.name = 'Basic Subscription';
    expect(subscription.name).toBe('Basic Subscription');
  });

  it('should initialize with empty memberships array', () => {
    const newSubscription = new Subscription();
    expect(newSubscription.memberships).toBeUndefined();
    newSubscription.memberships = [];
    expect(newSubscription.memberships).toHaveLength(0);
  });

  it('should handle all properties together', () => {
    const newSubscription = new Subscription();
    const testDate = new Date('2025-10-27');

    newSubscription.id = 'test-sub-123';
    newSubscription.name = 'Test Subscription';
    newSubscription.cost = 149.99;
    newSubscription.max_classes_assistance = 8;
    newSubscription.max_gym_assistance = 20;
    newSubscription.duration_months = 3;
    newSubscription.purchase_date = testDate;
    newSubscription.isActive = true;
    newSubscription.user = mockUser;
    newSubscription.memberships = [];

    expect(newSubscription).toEqual({
      id: 'test-sub-123',
      name: 'Test Subscription',
      cost: 149.99,
      max_classes_assistance: 8,
      max_gym_assistance: 20,
      duration_months: 3,
      purchase_date: testDate,
      isActive: true,
      user: mockUser,
      memberships: []
    });
  });
});