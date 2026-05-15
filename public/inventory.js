const table = document.getElementById("flowerTable");

// Load flowers on page load
loadFlowers();

// Fetch flower information from the database
async function loadFlowers() {
    try {
        const response = await fetch("/flowers");
        const flowers = await response.json();

        table.innerHTML = "";

        let stockBajo = 0;
        let totalUnidades = 0;

        // NOTE:
        // These .id, .name, should be the same as the ones in the database
        // user.Name will be undefined since only .name exists
        flowers.forEach(flower => {

            totalUnidades += flower.stock_quantity;

            const bajo = flower.stock_quantity <= flower.minimum_stock;

            if (bajo) stockBajo++;

            table.innerHTML += `
                <tr>
                    <td>${flower.name}</td>

                    <!-- <td>${flower.category}</td> -->

                    <td class="${bajo ? 'low-stock' : ''}">
                        ${flower.stock_quantity}
                    </td>

                    <!-- <td>${flower.minimum_stock}</td> -->

                    <td>
                        ${bajo
                    ? '<span class="low-stock">Stock Bajo</span>'
                    : 'Disponible'}
                    </td>

                    <td>
                        <div class="actions">

                            <button
                                class="edit-btn"
                                onclick="editFlower(${flower.id})">
                                Editar
                            </button>

                            <button
                                class="delete-btn"
                                onclick="deleteFlower(${flower.id})">
                                Eliminar
                            </button>

                        </div>
                    </td>
                </tr>
            `;
        });

        document.getElementById("totalProductos").textContent =
            flowers.length;

        document.getElementById("stockBajo").textContent =
            stockBajo;

        document.getElementById("totalUnidades").textContent =
            totalUnidades;

    } catch (error) {
        console.error(error);
    }
}

// updateFlower(1, "name", "newName");

// Parameter must be the database equivalent, eg. name, stock_quantity, or price
async function updateFlower(id, parameter, newAmount) {
    try {
        const response = await fetch(`/flowers/${id}/${parameter}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                [parameter]: newAmount
            })
        });

        const data = await response.json();

        // reload flowers
        if (response.ok) {
            loadFlowers();
        }

        console.log(data);

    } catch (error) {
        console.error(error);
    }

}

async function change(id, parameter) {
    const amount = document.getElementById("Input").value;

    await updateFlower(id, parameter, amount);
}

async function addFlower() {

    const nombre =
        document.getElementById('nombre').value.trim();

    const categoria =
        document.getElementById('categoria').value;

    const stock =
        parseInt(document.getElementById('stock').value);

    const minimo =
        parseInt(document.getElementById('minimo').value);

    if (!nombre || isNaN(stock) || isNaN(minimo)) {

        alert('Completa todos los campos');
        return;
    }

    try {

        const response = await fetch("/flowers", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({

                name: nombre,
                stock_quantity: stock,
                price: minimo
            })
        });

        const data = await response.json();

        console.log(data);

        document.getElementById('nombre').value = '';
        document.getElementById('stock').value = '';
        document.getElementById('minimo').value = '';

        loadFlowers();

    } catch (error) {

        console.error(error);
    }
}

async function deleteFlower(id) {
    try {

        await fetch(`/flowers/${id}`, {
            method: "DELETE"
        });

        loadFlowers();

    } catch (error) {

        console.error(error);
    }
}

async function editFlower(id) {
    const nuevoStock = prompt("Nuevo stock:");

    // User pressed cancel
    if (nuevoStock === null) {
        return;
    }

    // Validate integer
    const stock = parseInt(nuevoStock);

    if (isNaN(stock) || stock < 0) {
        alert("Ingresa un número válido");
        return;
    }

    try {

        const response = await fetch(
            `/flowers/${id}/stock_quantity`,
            {
                method: "PUT",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    stock_quantity: stock
                })
            }
        );

        const data = await response.json();

        console.log(data);

        loadFlowers();

    } catch (error) {

        console.error(error);
    }
}

