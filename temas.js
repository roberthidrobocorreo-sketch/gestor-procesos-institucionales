// Temas de color de la interfaz.
// El turquesa es el que trae style.css por defecto; los demás se aplican encima.
const TEMAS = {
    turquesa: { nombre: 'Turquesa', primario: '#1381A2', oscuro: '#0B5E7B', activo: '#0D6884', hover: '#0F6E8A', claro: '#E0F2FE', rgb: '19, 129, 162' },
    guinda: { nombre: 'Guinda', primario: '#851444', oscuro: '#600E31', activo: '#6D1038', hover: '#78123D', claro: '#F3E8EC', rgb: '133, 20, 68' },
    verde: { nombre: 'Verde pino', primario: '#1F7042', oscuro: '#165130', activo: '#195C36', hover: '#1C653B', claro: '#E9F1EC', rgb: '31, 112, 66' },
    naranja: { nombre: 'Terracota', primario: '#B85536', oscuro: '#843D27', activo: '#97462C', hover: '#A64C31', claro: '#F8EEEB', rgb: '184, 85, 54' }
};

const TEMA_POR_DEFECTO = 'turquesa';

// CSS que se agrega al final de style.css para el tema elegido (vacío si es el turquesa).
function cssTema(id) {
    const t = TEMAS[id];
    if (!t || id === TEMA_POR_DEFECTO) return '';
    return `\n/* Tema de color: ${t.nombre} */\n:root {\n` +
        `    --color-primario: ${t.primario};\n` +
        `    --color-primario-rgb: ${t.rgb};\n` +
        `    --color-primario-oscuro: ${t.oscuro};\n` +
        `    --color-primario-activo: ${t.activo};\n` +
        `    --color-primario-hover: ${t.hover};\n` +
        `    --color-primario-claro: ${t.claro};\n` +
        `}\n`;
}

module.exports = { TEMAS, TEMA_POR_DEFECTO, cssTema };
