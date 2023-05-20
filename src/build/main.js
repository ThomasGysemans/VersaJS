// This is a generated file, the most accurate javascript translation that the current version of VersaJS can give you.
// You can modify it as you wish, but all your changes will be deleted after a new compilation.
// Fri Dec 24 2021 17:25:28 GMT+0100 (heure normale d’Europe centrale)

;(function($){
	class IdCard extends VersaHTMLElement {
		static __name = "IdCard"

		constructor() {
			super("IdCard")
			this.props.name = ``
			this.props.age = 0
		}

		deleteData() {
			this.getProperty("setState")({ [`name`]: `Anonyme`, [`age`]: 0 })
		}

		render() {
			return $.html(
				"div", 
				[], 
				"", 
				[], 
				[], 
				[$.html(
					"h1", 
					[], 
					"", 
					[], 
					[], 
					[`Carte d'identité`]
				), $.html(
					"ul", 
					[], 
					"", 
					[], 
					[], 
					[$.html(
						"li", 
						[], 
						"", 
						[], 
						[], 
						[this.getProperty("name")]
					), $.html(
						"li", 
						[], 
						"", 
						[], 
						[], 
						[this.getProperty("age")]
					)]
				), $.html(
					"button", 
					[], 
					"", 
					[], 
					[["click", (this.getProperty("deleteData"))]], 
					[`Delete all data`]
				)]
			)
		}
	}
	$.CUSTOM_ELEMENTS["IdCard"] = IdCard

	$.mount($.html(
		"IdCard", 
		[], 
		"", 
		[["name", `Thomas`], ["age", 17]], 
		[], 
		[]
	))
})(window.Versa)