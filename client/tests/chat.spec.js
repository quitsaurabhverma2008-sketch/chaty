import { test, expect } from '@playwright/test';

test.describe('Chat Application', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load home page with correct title', async ({ page }) => {
    await expect(page).toHaveTitle('Chat App');
    await expect(page.getByTestId('app-title')).toBeVisible();
    await expect(page.getByTestId('app-title')).toHaveText('Chat App');
  });

  test('should show form elements on home page', async ({ page }) => {
    await expect(page.getByTestId('username-input')).toBeVisible();
    await expect(page.getByTestId('create-room-btn')).toBeVisible();
    await expect(page.getByTestId('room-id-input')).toBeVisible();
    await expect(page.getByTestId('join-room-btn')).toBeVisible();
  });

  test('should allow entering username', async ({ page }) => {
    const usernameInput = page.getByTestId('username-input');
    await usernameInput.fill('TestUser');
    await expect(usernameInput).toHaveValue('TestUser');
  });

  test('should allow entering room ID', async ({ page }) => {
    const roomIdInput = page.getByTestId('room-id-input');
    await roomIdInput.fill('1234');
    await expect(roomIdInput).toHaveValue('1234');
  });

  test('should only allow numeric room ID input', async ({ page }) => {
    const roomIdInput = page.getByTestId('room-id-input');
    await roomIdInput.clear();
    await roomIdInput.type('abc123xyz');
    const value = await roomIdInput.inputValue();
    expect(value).toMatch(/^\d+$/);
  });

  test('should limit room ID to 4 digits', async ({ page }) => {
    const roomIdInput = page.getByTestId('room-id-input');
    await roomIdInput.fill('123456');
    await expect(roomIdInput).toHaveValue('1234');
  });

  test('should disable join button when room ID is empty', async ({ page }) => {
    const joinBtn = page.getByTestId('join-room-btn');
    await expect(joinBtn).toBeDisabled();
  });

  test('should enable join button when room ID has 4 digits', async ({ page }) => {
    const roomIdInput = page.getByTestId('room-id-input');
    const joinBtn = page.getByTestId('join-room-btn');
    await roomIdInput.fill('1234');
    await expect(joinBtn).toBeEnabled();
  });

  test('should show error for invalid room ID format', async ({ page }) => {
    await page.getByTestId('room-id-input').fill('123');
    await page.locator('.btn-join').click();
    await expect(page.getByTestId('error-message')).toBeVisible();
    await expect(page.getByTestId('error-message')).toHaveText('Room ID must be 4 digits');
  });

  test('should create room successfully', async ({ page }) => {
    await page.getByTestId('create-room-btn').click();

    await expect(page.getByTestId('chat-room')).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId('room-id')).toBeVisible();
    await expect(page.getByTestId('leave-btn')).toBeVisible();
  });

  test('should show system message when joining room', async ({ page }) => {
    await page.getByTestId('create-room-btn').click();

    await expect(page.getByTestId('chat-room')).toBeVisible({ timeout: 15000 });
    const messagesArea = page.locator('.messages-area');
    await expect(messagesArea).toBeVisible();
  });

  test('should send message in chat room', async ({ page }) => {
    await page.getByTestId('create-room-btn').click();

    await expect(page.getByTestId('chat-room')).toBeVisible({ timeout: 15000 });

    const messageInput = page.getByTestId('message-input');
    await messageInput.fill('Hello World!');
    await page.getByTestId('send-btn').click();

    await expect(page.getByTestId('chat-message')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('chat-message')).toContainText('Hello World!');
  });

  test('should clear input after sending message', async ({ page }) => {
    await page.getByTestId('create-room-btn').click();

    await expect(page.getByTestId('chat-room')).toBeVisible({ timeout: 15000 });

    const messageInput = page.getByTestId('message-input');
    await messageInput.fill('Test message');
    await page.getByTestId('send-btn').click();

    await expect(messageInput).toHaveValue('');
  });

  test('should disable send button when input is empty', async ({ page }) => {
    await page.getByTestId('create-room-btn').click();

    await expect(page.getByTestId('chat-room')).toBeVisible({ timeout: 15000 });

    const sendBtn = page.getByTestId('send-btn');
    await expect(sendBtn).toBeDisabled();

    await page.getByTestId('message-input').fill('Test');
    await expect(sendBtn).toBeEnabled();
  });

  test('should navigate back to home on leave', async ({ page }) => {
    await page.getByTestId('create-room-btn').click();

    await expect(page.getByTestId('chat-room')).toBeVisible({ timeout: 15000 });

    await page.getByTestId('leave-btn').click();

    await expect(page.getByTestId('app-title')).toBeVisible();
    await expect(page.getByTestId('create-room-btn')).toBeVisible();
  });

  test('should apply modern styling', async ({ page }) => {
    const homeCard = page.locator('.home-card');
    await expect(homeCard).toHaveCSS('backdrop-filter', /blur/);
    await expect(homeCard).toHaveCSS('border-radius', '24px');
  });

  test('should have responsive design', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.getByTestId('create-room-btn')).toBeVisible();
    await expect(page.getByTestId('join-room-btn')).toBeVisible();
  });
});