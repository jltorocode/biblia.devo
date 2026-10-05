// Frases prototipo por (estado) y por (estado × area).
// Estas frases son las "consultas" semanticas que mapean a versiculos
// relevantes. Pensadas para ser cercanas al lenguaje real del usuario,
// no biblicas — el modelo de embeddings cruza la distancia.

export interface IntentDef {
  /** Clave compuesta: 'estado' o 'estado:area'. */
  key: string;
  /** Frase prototipo en lenguaje natural. */
  consulta: string;
}

// Intents formulados como el PERFIL DEL VERSO QUE QUEREMOS RECUPERAR,
// no como el problema del usuario. Si decimos "estoy ansioso" el modelo
// encuentra textos sobre angustia (Job, lamentaciones). Si decimos
// "promesa de paz, no temas, Dios cuida" trae el consuelo. La diferencia
// es brutal en calidad pastoral.
const POR_ESTADO: Record<string, string> = {
  ansioso:
    "Promesa de paz para el corazon ansioso. Dios cuida de ti, echa toda tu ansiedad sobre el, no temas, no te afanes por nada. La paz que sobrepasa todo entendimiento guardara tu corazon.",
  triste:
    "Consuelo para el triste y abatido. Cerca esta Dios del quebrantado de corazon. Bienaventurados los que lloran. El que enjuga toda lagrima.",
  solo:
    "Promesa de la presencia de Dios para el que se siente solo. Nunca te dejara ni te desamparara. Yo estare contigo todos los dias. No estoy solo porque mi Padre esta conmigo.",
  con_miedo:
    "Promesa de valor y proteccion contra el temor. No temas, esforzate y se valiente. Si Dios esta conmigo, quien contra mi. No me ha dado espiritu de cobardia sino de poder, amor y dominio propio.",
  enojado:
    "Exhortacion a la paciencia y dominio propio. Airaos pero no pequeis. La blanda respuesta quita la ira. El que tarda en airarse es mejor que el fuerte.",
  culpable:
    "Promesa de perdon para el que confiesa su pecado. Si confesamos nuestros pecados El es fiel y justo para perdonarnos. Ninguna condenacion hay. Como esta lejos el oriente del occidente.",
  cansado:
    "Promesa de descanso para el cansado. Venid a mi todos los que estais trabajados y cargados, y yo os hare descansar. Los que esperan en Jehova tendran nuevas fuerzas.",
  desesperanzado:
    "Promesa de esperanza para el desesperanzado. Las misericordias de Jehova son nuevas cada manana. La esperanza no avergonzo. El Dios de esperanza os llene de gozo.",
  buscando_direccion:
    "Promesa de direccion divina y sabiduria. Fia de Jehova de todo tu corazon, y el enderezara tus veredas. Si alguno tiene falta de sabiduria pidala a Dios.",
  necesitando_fe:
    "Promesa para fortalecer la fe debil. Senor, creo, ayuda mi incredulidad. La fe es la sustancia de las cosas que se esperan. La fe viene por el oir la Palabra.",
  en_prueba:
    "Promesa para el que atraviesa una prueba. Tened por sumo gozo cuando os hallareis en diversas tentaciones, la prueba obra paciencia. Todas las cosas obran para bien.",
  feliz_agradecido:
    "Salmo de alabanza y gratitud a Dios por Su bondad. Bendice alma mia a Jehova. Cantad alegres. Estad siempre gozosos, dad gracias en todo.",
  general:
    "Versiculo central de la fe cristiana, palabra de aliento universal, salmo de confianza, promesa eterna de Dios.",
};

// Modificadores por area. Se concatena al final de la consulta base del estado.
// El embedding del compuesto enfatiza el dominio especifico.
const MODIF_AREA: Record<string, string> = {
  trabajo:
    "Aplicado al trabajo, las labores, el sustento diario. No os afaneis por que comereis o que vestireis, busca primero el reino. Comer del fruto de su trabajo.",
  pareja:
    "Aplicado al matrimonio, al amor conyugal. Maridos amad a vuestras esposas como Cristo amo a la iglesia, esposas sed sumisas. El amor todo lo sufre.",
  familia:
    "Aplicado a la familia, a los hijos, a los padres. Honra a tu padre y a tu madre. Padres no exasperen a sus hijos. Yo y mi casa serviremos a Jehova.",
  amistad:
    "Aplicado a los amigos verdaderos, a la fidelidad de los hermanos en Cristo. En todo tiempo ama el amigo. Mejores son dos que uno.",
  salud:
    "Aplicado a la sanidad fisica y el consuelo en la enfermedad. Yo soy Jehova tu sanador. Por su llaga fuimos nosotros curados. La oracion de fe salvara al enfermo.",
  dinero:
    "Aplicado al dinero, las deudas, la provision diaria. Mi Dios pues suplira todo lo que os falta. Buscad primero el reino y todo os sera anadido. Contentaos con lo que teneis.",
  fe:
    "Aplicado a la vida espiritual, la oracion, la cercania con Dios. Buscadme y vivireis. Estad quietos y conoced que yo soy Dios. Acercaos a Dios y el se acercara a vosotros.",
  otra: "Aplicado a la vida en general.",
};

export function intentsTotales(): IntentDef[] {
  const lista: IntentDef[] = [];
  for (const [estado, consulta] of Object.entries(POR_ESTADO)) {
    lista.push({ key: estado, consulta });
    for (const [area, modif] of Object.entries(MODIF_AREA)) {
      lista.push({
        key: `${estado}:${area}`,
        consulta: `${consulta} ${modif}`,
      });
    }
  }
  return lista;
}

export function intentKey(estadoSlug: string, areaSlug: string | null): string {
  return areaSlug ? `${estadoSlug}:${areaSlug}` : estadoSlug;
}
