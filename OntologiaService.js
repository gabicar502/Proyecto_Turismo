// OntologiaService.js
const axios = require('axios');

class OntologiaService {
  constructor() {
    this.fusekiUrl = 'http://localhost:3030/OntologiaOferta/sparql';
  }

  // Consulta para obtener las categorías principales de la ontología
  async consultarCategoriasPrincipales() {
    const query = `
      PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      PREFIX owl: <http://www.w3.org/2002/07/owl#>
      PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
      PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
      PREFIX : <http://www.semanticweb.org/germanlozano/oferta#>

      SELECT (STRAFTER(STR(?x), "#") AS ?nombre)
      WHERE {
        ?x rdf:type owl:Class .
        FILTER NOT EXISTS { ?x rdfs:subClassOf ?superclass }
        FILTER STRSTARTS(STR(?x), STR(:))
      }
    `;
    return this.ejecutarConsulta(query);
  }

  // Consulta para obtener ofertas con valoración mayor a 4.5 y su tipo
  async consultarOfertasDestacadas() {
    const query = `
      PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      PREFIX owl: <http://www.w3.org/2002/07/owl#>
      PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
      PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
      PREFIX : <http://www.semanticweb.org/germanlozano/oferta#>

      SELECT ?nombre ?direccion 
             (REPLACE(STR(?valoracion2), "^^<http://www.w3.org/2001/XMLSchema#double>", "") AS ?valoracion)
             (STRAFTER(STR(?refType), "#") AS ?type)
      WHERE {
        ?x :direccion ?direccion .
        ?x :nombre ?nombre .
        ?x :valoracion ?valoracion2 .
        ?x rdf:type ?refType .
        FILTER(
          ?refType != owl:NamedIndividual &&
          (?valoracion2 > 4.5)
        )
      }
    `;
    return this.ejecutarConsulta(query);
  }

  // ✅ NUEVO: Consulta las subcategorías de una categoría específica
  async consultarSubcategoriasDeCategoria(categoria) {
    // Reemplazar espacios por guiones bajos
    const categoriaNormalizada = categoria.replace(/ /g, '_');

    const query = `
      PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      PREFIX owl: <http://www.w3.org/2002/07/owl#>
      PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
      PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
      PREFIX : <http://www.semanticweb.org/germanlozano/oferta#>

     SELECT (strafter(str(?x), "#") AS ?nombre) WHERE {
    ?x rdfs:subClassOf :${categoriaNormalizada} .
      }
    `;
    return this.ejecutarConsulta(query);
  }

  // Método genérico para ejecutar una consulta SPARQL y obtener resultados en JSON
  async ejecutarConsulta(query) {
    try {
      const response = await axios.get(this.fusekiUrl, {
        params: { query },
        headers: {
          'Accept': 'application/sparql-results+json'
        }
      });
      return response.data.results.bindings;
    } catch (error) {
      console.error('Error al consultar Fuseki:', error.response?.data || error.message);
      throw error;
    }
  }

  // Consulta las instancias con sus propiedades de una categoría (incluye subclases)
  async consultarInstanciasDeCategoria(categoria) {
    const categoriaNormalizada = categoria.replace(/ /g, '_');

    const query = `
      PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
      PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
      PREFIX : <http://www.semanticweb.org/germanlozano/oferta#>

      SELECT 
        (STRAFTER(STR(?instancia), "#") AS ?Instancia) 
        (STRAFTER(STR(?propiedad), "#") AS ?Propiedad)
        (
          IF(DATATYPE(?detalles) = xsd:double,
            IF(FLOOR(?detalles) = ?detalles,
              STR(xsd:integer(?detalles)),
              STR(xsd:decimal(?detalles))
            ),
            STR(?detalles)
          ) AS ?Detalles
        )
      WHERE {
        ?instancia rdf:type ?subclase .
        ?subclase rdfs:subClassOf* :${categoriaNormalizada} .
        ?instancia ?propiedad ?detalles .
        FILTER(isLiteral(?detalles))
      }
    `;
    return this.ejecutarConsulta(query);
  }
 
  // 🔍 Buscar instancias por texto libre en nombre, dirección, valoración y tipo
async buscarInstanciasPorTexto(queryData, offset = 0) {
  const query = `
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX owl: <http://www.w3.org/2002/07/owl#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
    PREFIX : <http://www.semanticweb.org/germanlozano/oferta#>

    SELECT ?nombre ?direccion 
           (REPLACE(STR(?valoracion2), "^^<http://www.w3.org/2001/XMLSchema#double>", "") AS ?valoracion)
           (STRAFTER(STR(?refType), "#") AS ?type)
    WHERE {
      ?x :direccion ?direccion .
      ?x :nombre ?nombre .
      ?x :valoracion ?valoracion2 .
      ?x rdf:type ?refType .
      FILTER (
        ?refType != owl:NamedIndividual &&
        (
          regex(STR(?nombre), "${queryData}", "i") ||
          regex(STR(?direccion), "${queryData}", "i") ||
          regex(STR(?valoracion2), "${queryData}", "i") ||
          regex(STR(?refType), "${queryData}", "i")
        )
      )
    }
    LIMIT 20 OFFSET ${offset}
  `;

  return this.ejecutarConsulta(query);
  }
 
  // Método genérico para ejecutar una consulta SPARQL y obtener resultados en JSON
  async ejecutarConsulta(query) {
    try {
      const response = await axios.get(this.fusekiUrl, {
        params: { query },
        headers: {
          'Accept': 'application/sparql-results+json'
        }
      });
      return response.data.results.bindings;
    } catch (error) {
      console.error('Error al consultar Fuseki:', error.response?.data || error.message);
      throw error;
    }
  }
}

module.exports = OntologiaService;