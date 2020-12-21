test('chrome is mocked in the global scope', () => {
  expect(chrome).toBeDefined()
  expect(chrome.runtime).toBeDefined()
  expect(chrome.runtime.sendMessage).toBeDefined()
})
