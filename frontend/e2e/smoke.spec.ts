import { expect, test } from '@playwright/test'
import { makeUniqueCif } from './tax-id-factory'

// Recorrido completo de la herramienta contra la API real:
// alta → simular → guardar → cambiar divisa.
test('alta de cliente, simulación, guardado y cambio de divisa', async ({ page }) => {
  const taxId = makeUniqueCif()
  const companyName = `Smoke Test ${taxId}`

  await test.step('alta de cliente con CIF válido', async () => {
    await page.goto('/clientes/nuevo')
    await page.getByLabel('Nombre de la empresa').fill(companyName)
    await page.getByLabel('Email').fill(`smoke-${taxId.toLowerCase()}@example.com`)
    await page.getByLabel('Identificador fiscal').fill(taxId)
    await page.getByLabel('Plan').click()
    await page.getByRole('option', { name: 'Pro' }).click()
    await page.getByRole('button', { name: 'Dar de alta' }).click()

    // El alta redirige al detalle del cliente recién creado.
    await expect(page).toHaveURL(/\/clientes\/[^/]+$/)
    await expect(page.getByRole('heading', { name: companyName })).toBeVisible()
  })

  const projection = page.getByRole('status').filter({ hasText: 'Proyección' })

  await test.step('la proyección responde en vivo al número de usuarios', async () => {
    await page.getByRole('textbox', { name: 'Usuarios activos' }).fill('15')
    // Caso dorado RN-01: 15 usuarios → 140 € base, 21 % IVA → 169,40 €.
    await expect(projection).toContainText('169,40')
  })

  await test.step('guardar persiste la simulación en el histórico', async () => {
    await page.getByRole('button', { name: 'Guardar simulación' }).click()
    await expect(page.getByText('Simulación guardada')).toBeVisible()

    const history = page.getByRole('list').filter({ hasText: '15 usuarios' })
    await expect(history.getByText('169,40 €')).toBeVisible()
  })

  await test.step('el cambio de divisa reexpresa los importes ya guardados', async () => {
    await page.getByLabel('Divisa').click()
    await page.getByRole('option', { name: 'USD' }).click()

    // La conversión es de presentación: cambia el símbolo, no se reescribe nada.
    await expect(page.getByText('169,40 €')).toHaveCount(0)
    await expect(page.getByText(/US\$\s?\d/).first()).toBeVisible()
  })
})
