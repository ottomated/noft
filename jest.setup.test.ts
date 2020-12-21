test('browser is defined in the global scope', () => {
  expect(browser).toBeDefined()
  expect(browser.runtime).toBeDefined()
  expect(browser.runtime.sendMessage).toBeDefined()
})

test('chrome is mocked in the global scope', () => {
  expect(chrome).toBeDefined()
  expect(chrome.runtime).toBeDefined()
  expect(chrome.runtime.sendMessage).toBeDefined()
})
