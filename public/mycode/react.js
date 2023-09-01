/* eslint-disable prettier/prettier */
const Loading = () => {
  return (
    <div className="lds-ring"><div></div><div></div><div></div><div></div></div>
  )
}

const getCurrentDatex = (time) => {
  const date = new Date();
  switch (time) {
    case 'today':
      date.setHours(date.getHours());
      break;

    case 'yesterday':
      date.setHours(date.getHours() - 24);
      break;

    case 'week':
      date.setHours(date.getHours() - 168);
      break;
    case 'twoWeeks':
      date.setHours(date.getHours() - 336);
      break;
    case 'oneMounth':
      date.setHours(date.getHours() - 720);
      break;

    default:
      date.setHours(date.getHours());
  }
  date.setHours(date.getHours() - 4);
  return date.toISOString().slice(0, 10);

}

const departamentosBolivia = [
  'La Paz',
  'Oruro',
  'Potosi',
  'Santa Cruz',
  'Beni',
  'Pando',
  'Cochabamba',
  'Tarija',
  'Chuquisaca',
]
const Calendario = () => {

  const today = getCurrentDatex('today');

  const [dateState, setDate] = React.useState({
    dateStart: today,
    geoJson: null,
    showMenu: false,
  });

  const [message, setMessage] = React.useState();
  const [loading, setLoading] = React.useState(false);
  const [departamento, setDepartamento] = React.useState(departamentosBolivia[0]);
  const [provinciasArray, setProvinciasArray] = React.useState([]);
  const [provincia, setProvincia] = React.useState('');

  const getCurrentDate = (time) => {
    const date = new Date(dateState.dateStart);

    switch (time) {
      case 'today':
        date.setHours(date.getHours() - 0);
        break;

      case '24hrs':
        date.setHours(date.getHours() - 24);
        break;

      case 'week':
        date.setHours(date.getHours() - 168);
        break;
      case 'twoWeeks':
        date.setHours(date.getHours() - 336);
        break;
      case 'oneMounth':
        date.setHours(date.getHours() - 720);
        break;

      default:
        date.setHours(date.getHours() - 0);
    }
    date.setHours(date.getHours() - 4 + 24);
    return date.toISOString().slice(0, 10);

  }

  React.useEffect(() => {
    consultByRange('today');
  }, []);

  React.useEffect(() => {
    const loadProvincias = async () => {
      const array = await getProvinciasNames(departamento);
      setProvinciasArray(array);
    }
    loadProvincias();
  }, [dateState.showMenu, departamento]);

  const onChange = async (value, campo) => {
    setDate({
      ...dateState,
      [campo]: value
    });
  }

  const consultByRange = async (range) => {
    let geoJsonData;
    setLoading(true);

    if (!dateState.showMenu) {

      switch (range) {
        case 'today':
          geoJsonData = await getByBetweenDate(getCurrentDate('today'), getCurrentDate('today'));
          setMessage(`Hoy ${moment(dateState.dateStart).format('LL')}`);
          break;

        case '24hrs':
          geoJsonData = await getByBetweenDate(getCurrentDate('24hrs'), getCurrentDate('today'));
          setMessage(`las ultimas 24 horas a partir de ${moment(dateState.dateStart).format('LL')}`);
          break;

        case 'week':
          geoJsonData = await getByBetweenDate(getCurrentDate('week'), getCurrentDate('today'));
          setMessage(`los ultimos 7 dias a partir de ${moment(dateState.dateStart).format('LL')}`);
          break;

        case 'twoWeeks':
          geoJsonData = await getByBetweenDate(getCurrentDate('twoWeeks'), getCurrentDate('today'));
          setMessage('las ultimas 2 semanas');
          break;
        /* case 'oneMounth':
          geoJsonData = await getByBetweenDate(getCurrentDate('oneMounth'), getCurrentDate('today'));
          setMessage('hace un 1 mes');
          break; */

        default:
          break;
      }
    } else {
      if (provincia.length !== 0) {
        switch (range) {
          case 'today':
            geoJsonData = await getHeatSourcesByProvincia(getCurrentDate('today'), getCurrentDate('today'), provincia);
            setMessage(`Hoy ${moment(dateState.dateStart).format('LL')} del departamento de ${departamento}`);

            break;

          case '24hrs':
            geoJsonData = await getHeatSourcesByProvincia(getCurrentDate('24hrs'), getCurrentDate('today'), provincia);
            setMessage(`Hoy ${moment(dateState.dateStart).format('LL')} del departamento de ${departamento}`);
            break;

          case 'week':
            geoJsonData = await getHeatSourcesByProvincia(getCurrentDate('week'), getCurrentDate('today'), provincia);
            setMessage(`Hoy ${moment(dateState.dateStart).format('LL')} del departamento de ${departamento}`);
            break;

          case 'twoWeeks':
            geoJsonData = await getHeatSourcesByProvincia(getCurrentDate('twoWeeks'), getCurrentDate('today'), provincia);
            setMessage(`Hoy ${moment(dateState.dateStart).format('LL')} del departamento de ${departamento}`);
            break;

          default:
            break;
        }
      } else {
        switch (range) {
          case 'today':
            geoJsonData = await getHeatSourcesByDeparment(getCurrentDate('today'), getCurrentDate('today'), departamento);
            setMessage(`Hoy ${moment(dateState.dateStart).format('LL')} del departamento de ${departamento}`);

            break;

          case '24hrs':
            geoJsonData = await getHeatSourcesByDeparment(getCurrentDate('24hrs'), getCurrentDate('today'), departamento);
            setMessage(`Hoy ${moment(dateState.dateStart).format('LL')} del departamento de ${departamento}`);
            break;

          case 'week':
            geoJsonData = await getHeatSourcesByDeparment(getCurrentDate('week'), getCurrentDate('today'), departamento);
            setMessage(`Hoy ${moment(dateState.dateStart).format('LL')} del departamento de ${departamento}`);
            break;

          case 'twoWeeks':
            geoJsonData = await getHeatSourcesByDeparment(getCurrentDate('twoWeeks'), getCurrentDate('today'), departamento);
            setMessage(`Hoy ${moment(dateState.dateStart).format('LL')} del departamento de ${departamento}`);
            break;

          default:
            break;
        }
      }


    }

    setLoading(false);
    /*     console.log(geoJsonData); */
    setDate(prevState => ({
      ...prevState,
      geoJson: geoJsonData,
    }));

    pintarMapa(geoJsonData);
  }

  const onSubmit = (e) => {
    e.preventDefault();
  }

  const convertirFecha = (date) => {
    /* 2021-09-14 */
    const newDate = date.split('-');
    const datecurrent = `${newDate[2]}-${newDate[1]}-${newDate[0]}`;
    return datecurrent;
  }

  const consultarPorDepartamento = async () => {

    setLoading(true);

    const geoJsonData = await getHeatSourcesByDeparment(getCurrentDate('week'), getCurrentDate('today'), departamento);
    setLoading(false);

    setDate(prevState => ({
      ...prevState,
      geoJson: geoJsonData,
    }));

    pintarMapa(geoJsonData);
  }



  return (
    <div className="calendar">
      <h3>Consultar Focos de calor</h3>
      <form onSubmit={onSubmit}>
        <span className="fromTo">Desde</span>

        <input
          type="date"
          name="dateStart"
          max={today}
          value={dateState.dateStart}
          onChange={({target}) => onChange(target.value, target.name)}
        />
        {dateState.showMenu &&
          <React.Fragment>
            <label htmlFor="">Seleccionar Departamento</label>

            <select name="departamento" id="" onChange={(e) => setDepartamento(e.target.value)}>
              {departamentosBolivia.map((departament) =>
              (<option
                key={departament}
                value={departament}>{departament}</option>))}
            </select><br />

            <select
              onChange={(e) => setProvincia(e.target.value)}
            >
              <option
                value=''>
                Seleccionar provincia
              </option>
              {provinciasArray && provinciasArray.resp.map(option => (

                <option
                  value={option.nombre_provincia}>
                  {option.nombre_provincia}
                </option>
              ))}
            </select>
          </React.Fragment>
        }
        <input type="checkbox" name="showMenu" id="" onChange={(e) => onChange(e.target.checked, e.target.name)} />

        <div className="group-buttons">
          <button onClick={() => consultByRange('today')}>Consultar {moment(dateState.dateStart).format('LL')}</button>
          <button onClick={() => consultByRange('24hrs')}>24 horas</button>
          <button onClick={() => consultByRange('week')}>7 dias</button>
          {/* {dateState.showMenu &&
            <button onClick={consultarPorDepartamento}>Consultar por departamento</button>
          } */}
        </div>

        <div className="information">
          <span>Consultado focos de calor de {message}</span>
        </div>
        {
          loading &&
          <Loading />
        }
      </form >
    </div >
  );
}


function App() {
  return (
    <React.Fragment>
      <Calendario />
    </React.Fragment>
  );
}

ReactDOM.render(<App />, document.getElementById('app'));
