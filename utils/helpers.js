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

  function obtenerFechaEnFormatoDate(fecha) {
  
    const fechaObjeto = new Date(fecha);

    // Verificar si la fecha es válida antes de continuar
    if (!isNaN(fechaObjeto.getTime())) {
      // Obtener año, mes y día
      const año = fechaObjeto.getFullYear();
      const mes = ('0' + (fechaObjeto.getMonth() + 1)).slice(-2); // Agregar 1 ya que los meses en JavaScript van de 0 a 11
      const dia = ('0' + fechaObjeto.getDate()).slice(-2);
    
      // Formato AAAA/MM/DD
      const fechaSQL = `${año}/${mes}/${dia}`;
      return fechaSQL;
      // console.log(fechaSQL);
    } else {
      return null;
    }
  }

  function formatFechaEmail(fechaOriginal) {
    // Dividir la fecha en año, mes y día
    const [ano, mes, dia] = fechaOriginal.split('-');
  
    // Formatear la fecha en el nuevo formato
    const fechaFormateada = `${dia}/${mes}/${ano}`;

    return fechaFormateada;
}

  module.exports = {obtenerPeriodoDelDiaConHora,obtenerFechaEnFormatoDate, formatFechaEmail};