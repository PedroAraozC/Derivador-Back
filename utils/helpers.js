function obtenerPeriodoDelDiaConHora(fechaString) {
    const hora = fechaString.split(", ")[1].split(":")[0];

    const horaActual = parseInt(hora, 10);
   
    if (horaActual >= 6 && horaActual < 12) {
      return "mañana";
    } else if (horaActual >= 12 && horaActual < 18) {
      return "intermedio";
    } else if (horaActual >= 18 && horaActual < 24) {
      return "tarde";
    } else{
      return "noche";
    }
  }

  module.exports = obtenerPeriodoDelDiaConHora;