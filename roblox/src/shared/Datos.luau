--!nonstrict
-- ARCHIVO GENERADO por tools/gen-roblox.js desde src/core.js — NO EDITAR A MANO.
-- Índices: BLD[i].i y STI son base 0 (igual que en la versión HTML) para que las partidas sean compatibles.
return {
	VERSION = "0.7.0",
	SAVE_KEY = "bdp.save.v1",
	M = "@m",
	EL = {
		fuego = {
			n = "Fuego",
			ic = "🔥",
			c = "#ff4d2e",
			sk = "Puño Ígneo",
			d = "Proyectil de fuego. Daño ×2.4",
			cd = 4,
			cost = 30,
			x = 2.4
		},
		agua = {
			n = "Agua",
			ic = "💧",
			c = "#2fb8ff",
			sk = "Marea Viva",
			d = "Cura 30% y empuja a todos",
			cd = 9,
			cost = 40,
			x = 1
		},
		rayo = {
			n = "Rayo",
			ic = "⚡",
			c = "#ffd23a",
			sk = "Destello",
			d = "Embestida que atraviesa. Daño ×1.8",
			cd = 3.5,
			cost = 25,
			x = 1.8
		},
		tierra = {
			n = "Tierra",
			ic = "⛰️",
			c = "#d08a3c",
			sk = "Muralla",
			d = "Escudo −60% daño 4 s + temblor ×1.3",
			cd = 9,
			cost = 40,
			x = 1.3
		},
		viento = {
			n = "Viento",
			ic = "🌀",
			c = "#6dffd0",
			sk = "Ciclón",
			d = "Torbellino en área ×1.6 que atrae",
			cd = 6,
			cost = 35,
			x = 1.6
		},
		sombra = {
			n = "Sombra",
			ic = "🌑",
			c = "#a42cff",
			sk = "Eclipse",
			d = "Golpe ×2.2 que roba 50% como vida",
			cd = 6,
			cost = 35,
			x = 2.2,
			lock = "act2"
		},
		luz = {
			n = "Luz",
			ic = "✨",
			c = "#fff1a8",
			sk = "Aurora",
			d = "Estallido ×2.2 en área y cura 15%",
			cd = 10,
			cost = 50,
			x = 2.2,
			lock = "act3"
		}
	},
	ELK5 = {"fuego", "agua", "rayo", "tierra", "viento"},
	TIERS = {{
			n = "Bronce",
			m = 1,
			c = "#c87f4a"
		}, {
			n = "Plata",
			m = 1.4,
			c = "#d6dee9"
		}, {
			n = "Oro",
			m = 2,
			c = "#ffc23a"
		}, {
			n = "Mítico",
			m = 3,
			c = "#ff2fb3"
		}, {
			n = "Origen",
			m = 4.5,
			c = "#ffffff"
		}},
	RANKS = {{0, "Novato"}, {60, "Aprendiz"}, {300, "Luchador"}, {1500, "Guerrero"}, {8000, "Élite"}, {40000, "Maestro"}, {200000, "Campeón"}, {1000000, "Leyenda"}},
	ORIG = {
		discipulo = {
			n = "Discípulo",
			ic = "🥋",
			z = "dojo",
			m = "ren",
			st = {
				fue = 6,
				tec = 5,
				esp = 4
			},
			oro = 20,
			d = "Creciste en el Dojo de la Cumbre. Tu fuerza nace de la disciplina."
		},
		mercader = {
			n = "Mercader",
			ic = "⚒️",
			z = "forja",
			m = "tobias",
			st = {
				fue = 4,
				tec = 5,
				esp = 6
			},
			oro = 60,
			d = "Creciste entre yunques y monedas. Sabes que la magia también se trabaja."
		},
		superviviente = {
			n = "Superviviente",
			ic = "🗡️",
			z = "tierras",
			m = "kira",
			st = {
				fue = 6,
				tec = 6,
				esp = 3
			},
			oro = 10,
			d = "Creciste en las Tierras Rotas. Nadie te regaló nada."
		}
	},
	NPC = {
		ren = {
			n = "Maestra Ren",
			c = "#e0262f"
		},
		tobias = {
			n = "Don Tobías",
			c = "#f0b429"
		},
		kira = {
			n = "Kira",
			c = "#2dffb3"
		},
		pip = {
			n = "Pip",
			c = "#39c8ff"
		},
		heraldo = {
			n = "El Heraldo",
			c = "#d6dee9"
		},
		vant = {
			n = "Vant, el Anfitrión",
			c = "#a42cff"
		},
		dax = {
			n = "Dax",
			c = "#ff2fb3"
		},
		nima = {
			n = "Oráculo Nima",
			c = "#fff1a8"
		},
		sol = {
			n = "Capitana Sol",
			c = "#f0b429"
		},
		elio = {
			n = "Guardabosques Elio",
			c = "#2dffb3"
		},
		rosa = {
			n = "Abuela Rosa",
			c = "#ff8fb8"
		},
		nar = {
			n = "Narración",
			c = "#f0b429"
		}
	},
	ZONES = {
		plaza = {
			n = "Plaza Ágora",
			k = "Social · Paz"
		},
		dojo = {
			n = "Dojo de la Cumbre",
			k = "Entrenamiento"
		},
		forja = {
			n = "Ciudad Forja",
			k = "Tycoon · Paz"
		},
		tierras = {
			n = "Tierras Rotas",
			k = "Farmeo · Peligro"
		},
		coliseo = {
			n = "Coliseo del Eclipse",
			k = "Torneo Mundial"
		},
		bosque = {
			n = "Bosque de la Niebla",
			k = "Terror · Supervivencia"
		},
		huertos = {
			n = "Huertos del Valle",
			k = "Tycoon · Granja"
		}
	},
	FOES = {
		eco = {
			n = "Eco",
			hp = 0.35,
			dm = 0.45,
			sp = 70,
			x = 1,
			o = 2,
			ch = 0.08,
			r = 13,
			rng = 34,
			wind = 0.5,
			cd = 1.3
		},
		lobo = {
			n = "Lobo de Ceniza",
			hp = 0.6,
			dm = 0.55,
			sp = 125,
			x = 1.8,
			o = 4,
			ch = 0.12,
			r = 15,
			rng = 36,
			wind = 0.4,
			cd = 1.1
		},
		bandido = {
			n = "Bandido",
			hp = 1,
			dm = 0.75,
			sp = 95,
			x = 3,
			o = 9,
			ch = 0.18,
			r = 14,
			rng = 40,
			wind = 0.45,
			cd = 1.2
		},
		golem = {
			n = "Gólem de Obsidiana",
			hp = 7,
			dm = 1.5,
			sp = 55,
			x = 22,
			o = 80,
			ch = 1,
			chn = 6,
			r = 30,
			rng = 74,
			wind = 0.9,
			cd = 2.4,
			boss = 1,
			aoe = 1
		},
		reyeco = {
			n = "Rey Eco",
			hp = 5,
			dm = 1.1,
			sp = 60,
			x = 12,
			o = 40,
			ch = 1,
			chn = 3,
			r = 24,
			rng = 62,
			wind = 0.75,
			cd = 2,
			boss = 1,
			aoe = 1
		},
		alfa = {
			n = "Alfa de Ceniza",
			hp = 5.5,
			dm = 1.3,
			sp = 150,
			x = 16,
			o = 60,
			ch = 1,
			chn = 4,
			r = 22,
			rng = 230,
			wind = 0.6,
			cd = 1.8,
			boss = 1
		},
		rival = {
			n = "Rival",
			hp = 1.4,
			dm = 0.85,
			sp = 140,
			x = 5,
			o = 15,
			ch = 0.3,
			r = 14,
			rng = 44,
			wind = 0.35,
			cd = 0.9,
			pvp = 1
		},
		duelo = {
			n = "Duelista",
			hp = 3,
			dm = 1.3,
			sp = 150,
			x = 0,
			o = 0,
			ch = 0,
			r = 14,
			rng = 46,
			wind = 0.3,
			cd = 0.55,
			pvp = 1
		},
		vant = {
			n = "Vant",
			hp = 6,
			dm = 1.1,
			sp = 150,
			x = 0,
			o = 0,
			ch = 0,
			r = 16,
			rng = 50,
			wind = 0.36,
			cd = 0.6,
			pvp = 1,
			boss = 1
		},
		sombra = {
			n = "Sombra Cazadora",
			hp = 0.5,
			dm = 0,
			sp = 85,
			x = 0,
			o = 0,
			ch = 0,
			r = 14,
			rng = 26,
			wind = 0,
			cd = 1
		}
	},
	RINGS = {{
			min = 15,
			f = 0.45,
			rec = 0
		}, {
			min = 120,
			f = 0.8,
			rec = 100
		}, {
			min = 450,
			f = 1.15,
			rec = 400
		}},
	BLD = {{
			id = "pan",
			n = "Puesto de Pan",
			ic = "🥖",
			b = 0.5,
			c = 15,
			i = 0
		}, {
			id = "herr",
			n = "Herrería",
			ic = "⚒️",
			b = 2,
			c = 110,
			i = 1
		}, {
			id = "runa",
			n = "Taller de Runas",
			ic = "🔮",
			b = 8,
			c = 700,
			i = 2
		}, {
			id = "merc",
			n = "Mercado",
			ic = "🏪",
			b = 30,
			c = 4200,
			i = 3
		}, {
			id = "banco",
			n = "Banco Arcano",
			ic = "🏦",
			b = 110,
			c = 26000,
			i = 4
		}, {
			id = "acad",
			n = "Academia",
			ic = "🎓",
			b = 420,
			c = 160000,
			i = 5
		}},
	ACT = {
		saco = {
			st = "fue",
			k = 1,
			en = 0.8
		},
		kata = {
			st = "tec",
			k = 4.5,
			en = 2
		},
		medita = {
			st = "esp",
			k = 28,
			en = -12
		}
	},
	GEAR = {
		fue = "Saco de Arena Pesado",
		tec = "Postes de Kata Rúnicos",
		esp = "Cascada Serena"
	},
	SHOP = {{
			id = "plata",
			n = "Brazalete de Plata",
			g = 150,
			d = "Poder ×1.4 permanente del elemento que elijas. Nunca se pierde en el torneo."
		}, {
			id = "oro",
			n = "Brazalete de Oro",
			g = 400,
			d = "Poder ×2 permanente. Nunca se pierde en el torneo."
		}, {
			id = "aura",
			n = "Aura de Tinta",
			g = 40,
			d = "Cosmético: trazos de cómic al moverte."
		}, {
			id = "capa",
			n = "Capa del Eclipse",
			g = 60,
			d = "Cosmético: capa ondeante."
		}, {
			id = "caja",
			n = "Caja fuerte +1 h",
			g = 30,
			d = "Tu negocio guarda 1 hora más de ganancias mientras no juegas."
		}},
	TOUR = {
		req = 120,
		nightT = 75,
		cut = 32,
		firstCap = 25,
		legado = 0.25,
		duelHp = 3
	},
	LOOK = {
		skin = {"#f5d0a9", "#e0ac69", "#c68642", "#8d5524", "#ffdbac", "#a0e0ff"},
		shirt = {"#e0262f", "#f0b429", "#0f5c66", "#39c8ff", "#a42cff", "#2dffb3", "#f2e8d5", "#1b1b22"},
		hair = {"#1b1b22", "#5a3825", "#f0b429", "#e0262f", "#f2e8d5", "#a42cff"}
	},
	CHAT = {"¡Hola! 👋", "¿Vamos al torneo?", "GG", "¿Me enseñas a forjar?", "¡Al Dojo!", "Cuidado con los Ecos", "Gracias 💛", "¡Qué combo!", "¿Amigos?", "Tú puedes 💪"},
	BOTCHAT = {
		plaza = {"¿alguien al torneo?", "hola :D", "mi brazalete es de plata!!", "Pip sabe todo xd", "quién vende pan", "gg ayer en el coliseo", "busco amigos 👋"},
		dojo = {"respira... 🧘", "100 golpes más", "la maestra Ren da miedo jaja", "combo x20!!", "mis katas mejoran"},
		forja = {"ya tengo banco 🏦", "compren pan 🥖", "el yunque da oro si lo golpeas", "subí la herrería a 25"},
		tierras = {"cuidado lobos", "ayuda en el anillo 2", "el gólem me tumbó 😭", "farmeando chispas", "alguien pvp?"},
		coliseo = {"me da miedo la Noche", "quedé puesto 12!", "no mires a las sombras... o sí?", "el Anfitrión es raro"}
	},
	REPLY = {"¡hola!", "jaja sí", "vamos!!", "gracias :)", "gg", "de una", "tú también 💪", "amigos ✋"},
	STORY = {{
			id = "p0",
			act = 1,
			t = "Despertar",
			o = {
				k = "talk",
				who = "@m"
			},
			r = {
				oro = 20
			},
			d = {
				discipulo = {{"ren", "Llegas tarde, pero llegas. Eso ya dice algo de ti."}, {"ren", "Ese brazalete en tu muñeca no es un adorno. Responde a lo que entrenas, no a lo que deseas."}, {"ren", "Golpea el saco treinta veces. Con ritmo, no con rabia."}},
				mercader = {{"tobias", "¡Por fin llegas! Aquí no importa de dónde vienes: importa lo que construyes."}, {"tobias", "En Ánima el poder es magia. Y la magia bien usada se vuelve pan, herramientas y oro."}, {"tobias", "Construye tu primer Puesto de Pan en la mesa del Tycoon. Un negocio pequeño alimenta sueños grandes."}},
				superviviente = {{"kira", "Shh. Agáchate. En las Tierras Rotas el ruido atrae Ecos."}, {"kira", "Tu brazalete brilla poco. Eso cambia peleando… y sobreviviendo."}, {"kira", "Derrota tres Ecos. Si te tumban, te levantas. Así se aprende aquí."}}
			}
		}, {
			id = "p1",
			act = 1,
			t = "Primer paso",
			r = {
				oro = 40,
				gemas = 5
			},
			o = {
				discipulo = {
					k = "train",
					st = "fue",
					n = 30
				},
				mercader = {
					k = "build",
					n = 1
				},
				superviviente = {
					k = "kill",
					type = "eco",
					n = 3
				}
			},
			h = {
				discipulo = "Golpea el saco 30 veces (Dojo)",
				mercader = "Compra 1 edificio en la mesa del Tycoon (Forja)",
				superviviente = "Derrota 3 Ecos (Tierras Rotas)"
			}
		}, {
			id = "p2",
			act = 1,
			t = "La Plaza Ágora",
			o = {
				k = "talk",
				who = "pip"
			},
			r = {
				gemas = 5
			},
			h = "Ve a la Plaza Ágora y habla con Pip",
			i = {{"nar", "Todos los caminos de Ánima se cruzan en la Plaza Ágora. Busca el portal."}},
			d = {{"pip", "¡Hola! Soy Pip, guía de la Plaza. Bueno, no oficial… pero conozco todo."}, {"pip", "Hay tres sendas para crecer: el Dojo entrena tu cuerpo, la Ciudad Forja convierte magia en oro, y en las Tierras Rotas… se pelea."}, {"pip", "Al norte está el Coliseo del Eclipse. Todos sueñan con su torneo. Yo prefiero mirarlo de lejos."}, {"pip", "Toma, mi amuleto de la suerte: en tu primer torneo no perderás más del 25% de tu poder. ¡No le digas a nadie!"}}
		}, {
			id = "a1",
			act = 1,
			t = "Tres sendas",
			o = {
				k = "power",
				n = 60
			},
			r = {
				oro = 80
			},
			h = "Alcanza 60 de Poder (rango Aprendiz)",
			i = {{"pip", "Entrena, pelea o invierte. Cualquier senda sirve. Lo importante es no rendirse."}}
		}, {
			id = "a2",
			act = 1,
			t = "Respira",
			o = {
				k = "train",
				st = "esp",
				n = 3
			},
			r = {
				gemas = 5
			},
			h = "Completa 3 respiraciones en la Cascada (Dojo)",
			i = {{"ren", "El poder sin calma se desborda. Ven a la cascada y respira conmigo."}, {"ren", "Inhala cuatro segundos. Exhala cuatro. Esto también sirve fuera del juego."}}
		}, {
			id = "a3",
			act = 1,
			t = "Oro con propósito",
			o = {
				k = "oro",
				n = 300
			},
			r = {
				gemas = 5
			},
			h = "Gana 300 de oro",
			i = {{"tobias", "Tu Espíritu hace que tus negocios produzcan más. Magia tangible, ¿ves? Gana 300 de oro."}}
		}, {
			id = "a4",
			act = 1,
			t = "Ecos en el polvo",
			o = {
				k = "kill",
				n = 10
			},
			r = {
				oro = 100,
				gemas = 5
			},
			h = "Derrota 10 enemigos en las Tierras Rotas",
			i = {{"kira", "Los Ecos son restos de poder sin dueño. Limpia diez y vuelve con vida."}}
		}, {
			id = "a5",
			act = 1,
			t = "La invitación",
			o = {
				k = "talk",
				who = "heraldo"
			},
			r = {
				gemas = 10
			},
			h = "Visita el Coliseo y habla con el Heraldo",
			d = {{"heraldo", "¡Bienvenida, bienvenido, al Coliseo del Eclipse!"}, {"vant", "Cien entran. Uno gana. Todos aprenden lo que valen."}, {"vant", "No temas perder. El poder que pierdas… encontrará un buen hogar."}, {"heraldo", "Para inscribirte necesitas 120 de Poder. ¡Y valor!"}}
		}, {
			id = "a6",
			act = 1,
			t = "Listo para el Eclipse",
			o = {
				k = "power",
				n = 120
			},
			r = {
				oro = 150
			},
			h = "Alcanza 120 de Poder"
		}, {
			id = "a7",
			act = 1,
			t = "El Torneo Mundial",
			o = {
				k = "tourney",
				r = 100
			},
			r = {
				gemas = 15
			},
			h = "Participa en el Torneo Mundial (Coliseo)",
			i = {{"heraldo", "Las inscripciones están abiertas. La primera prueba es la Noche: sobrevive a las sombras."}},
			e = {{"vant", "Interesante. Volverás. Todos vuelven."}, {"nar", "FIN DEL ACTO I · LA CHISPA"}}
		}, {
			id = "b1",
			act = 2,
			t = "Un rival roto",
			o = {
				k = "talk",
				who = "dax"
			},
			r = {
				gemas = 5
			},
			h = "Busca a Dax en las Tierras Rotas",
			i = {{"nar", "ACTO II · LA SOMBRA DEL TORNEO"}, {"kira", "Hay alguien nuevo cerca del portal de las Tierras. Dicen que fue del Top 10."}},
			d = {{"dax", "¿Qué miras? Hace un mes yo estaba en el Top 10."}, {"dax", "Quedé en el puesto 97. Perdí casi todo. Dicen que el poder perdido se esfuma."}, {"dax", "Mentira. Lo vi: un hilo de luz salió de mí y voló hacia el palco del Anfitrión."}}
		}, {
			id = "b2",
			act = 2,
			t = "El gólem que no duerme",
			o = {
				k = "kill",
				type = "golem",
				n = 1
			},
			r = {
				chispas = 10,
				gemas = 10
			},
			h = "Derrota al Gólem de Obsidiana (anillo 3)",
			i = {{"kira", "Si Dax tiene razón, el Gólem del fondo guarda restos de ese poder. Ve con cuidado: recomiendo 400 de Poder."}}
		}, {
			id = "b3",
			act = 2,
			t = "Un fragmento",
			o = {
				k = "talk",
				who = "@m"
			},
			r = {
				oro = 500
			},
			h = "Lleva el fragmento a tu mentor",
			d = {{"@m", "Esto es un fragmento del Brazalete del Origen. Hace siglos repartió el poder entre todos."}, {"@m", "Si alguien juntara los fragmentos con el poder de cien derrotas en cada torneo…"}, {"@m", "Entrena. Pero no para ser cruel. Entrena para que nadie tenga que perderlo todo."}}
		}, {
			id = "b4",
			act = 2,
			t = "Forja tu voluntad",
			o = {
				k = "forge",
				t = 1
			},
			r = {
				gemas = 10
			},
			h = "Consigue un brazalete de Plata o mejor (Forja)",
			i = {{"tobias", "Un brazalete de Plata multiplica tu poder y nunca se pierde. Forjarlo cuesta oro y chispas."}}
		}, {
			id = "b5",
			act = 2,
			t = "Guerrero",
			o = {
				k = "power",
				n = 1500
			},
			r = {
				oro = 2000
			},
			h = "Alcanza 1.500 de Poder (rango Guerrero)"
		}, {
			id = "b6",
			act = 2,
			t = "Sobrevivir a la Noche",
			o = {
				k = "tourney",
				r = 32
			},
			r = {
				gemas = 20
			},
			u = "act2",
			h = "Queda entre los 32 mejores del torneo",
			e = {{"vant", "Sobreviviste a mis sombras. ¿Sabes de dónde salen? De ustedes."}, {"nar", "Desbloqueado: elemento SOMBRA en la Forja."}, {"nar", "FIN DEL ACTO II"}}
		}, {
			id = "c1",
			act = 3,
			t = "La oráculo",
			o = {
				k = "talk",
				who = "nima"
			},
			r = {
				gemas = 10
			},
			h = "Habla con el Oráculo Nima (Plaza)",
			i = {{"nar", "ACTO III · EL BRAZALETE DEL ORIGEN"}},
			d = {{"nima", "Te contaré de Vant. Nació sin brazalete, en un mundo donde el poder lo era todo."}, {"nima", "Se rieron de él. Juró que nunca más sería “el que no vale nada”."}, {"nima", "Creó el torneo. Hoy vale más que nadie… y sigue sintiéndose vacío."}, {"nima", "El poder no define tu valor. Él nunca lo aprendió. ¿Lo aprenderás tú?"}}
		}, {
			id = "c2",
			act = 3,
			t = "Una mano",
			o = {
				k = "give",
				who = "dax",
				oro = 500
			},
			r = {
				gemas = 15
			},
			h = "Ayuda a Dax con 500 de oro (Tierras Rotas)",
			d = {{"dax", "¿Por qué me ayudas? Nadie ayuda en Ánima…"}, {"dax", "Gracias. Voy a reconstruir mi taller. Esta vez para enseñar, no para presumir."}}
		}, {
			id = "c3",
			act = 3,
			t = "Élite",
			o = {
				k = "power",
				n = 8000
			},
			r = {
				oro = 20000
			},
			h = "Alcanza 8.000 de Poder (rango Élite)"
		}, {
			id = "c4",
			act = 3,
			t = "Los diez mejores",
			o = {
				k = "tourney",
				r = 10
			},
			r = {
				gemas = 25
			},
			u = "act3",
			h = "Queda en el Top 10 del torneo",
			e = {{"nar", "Desbloqueado: elemento LUZ en la Forja."}, {"vant", "Diez. Ya casi. Cuando ganes, subirás a mi palco. Solo."}}
		}, {
			id = "c5",
			act = 3,
			t = "El campeón del Eclipse",
			o = {
				k = "boss",
				who = "vant"
			},
			r = {
				gemas = 50
			},
			h = "Gana el torneo y vence a Vant",
			e = {{"vant", "¿Cómo…? Tenía el poder de miles…"}, {"vant", "Tómalo. Toma el Brazalete del Origen. Ahora tú decides quién vale."}}
		}, {
			id = "c6",
			act = 3,
			t = "La decisión",
			o = {
				k = "choice"
			},
			r = {
				gemas = 30
			},
			h = "Decide qué hacer con el Brazalete del Origen"
		}, {
			id = "d1",
			act = 4,
			t = "Luces sin dueño",
			o = {
				k = "talk",
				who = "nima"
			},
			r = {
				gemas = 10
			},
			h = "Habla con el Oráculo Nima (Plaza)",
			i = {{"nar", "ACTO IV · LAS LUCES SIN DUEÑO"}, {"nar", "Semanas después, algo extraño ocurre en Ánima: de noche, pequeñas luces flotan sin rumbo."}},
			d = {
				compartir = {{"nima", "Rompiste el Brazalete y el poder volvió a la gente… pero no todo encontró su camino."}, {"nima", "Los frascos del palco guardaban luces de personas que ya no viven en Ánima. Esas luces no tienen a dónde volver."}},
				corona = {{"nima", "Llevas el Brazalete del Origen. ¿Sientes su peso? Son miles de luces ajenas."}, {"nima", "Algunas ya no tienen dueño a quien volver. Vagan. Y si nadie las cuida, se vuelven Ecos."}}
			}
		}, {
			id = "d2",
			act = 4,
			t = "El palco vacío",
			o = {
				k = "talk",
				who = "vant"
			},
			r = {
				gemas = 10
			},
			h = "Busca a Vant en el Coliseo",
			d = {{"vant", "Viniste. Pensé que nadie volvería a hablarme."}, {"vant", "Cada luz de esos frascos tenía un nombre. Me los sé todos. Los repito de noche."}, {"vant", "No te pido que me perdones. Te pido ayuda para hacer algo bien, por una vez."}}
		}, {
			id = "d3",
			act = 4,
			t = "Reyes de lo perdido",
			o = {
				k = "kill",
				type = "reyeco",
				n = 2
			},
			r = {
				chispas = 15
			},
			h = "Libera a 2 Reyes Eco (Tierras Rotas, anillo 1)",
			i = {{"kira", "Los Reyes Eco son luces que se cansaron de buscar. Liberarlos no es destruirlos: es dejarlos descansar."}}
		}, {
			id = "d4",
			act = 4,
			t = "Luces en el agua",
			o = {
				k = "fish",
				n = 5
			},
			r = {
				oro = 3000,
				gemas = 10
			},
			h = "Pesca 5 peces en la fuente de la Plaza",
			i = {{"nima", "Las luces más tímidas se esconden en el agua. Pescarlas con paciencia las calma."}, {"pip", "¡Yo te enseño a pescar! Lanza, espera la picada y no tires demasiado fuerte."}}
		}, {
			id = "d5",
			act = 4,
			t = "Lo que no se olvida",
			o = {
				k = "talk",
				who = "@m"
			},
			r = {
				gemas = 10
			},
			h = "Habla con tu mentor sobre el perdón",
			d = {{"@m", "¿Perdonar a Vant? Perdonar no es olvidar lo que hizo."}, {"@m", "Es decidir que el daño no va a decidir quién eres tú."}, {"@m", "Y a veces, es darle a alguien la oportunidad de reparar lo que rompió."}}
		}, {
			id = "d6",
			act = 4,
			t = "Maestría",
			o = {
				k = "power",
				n = 40000
			},
			r = {
				oro = 50000
			},
			h = "Alcanza 40.000 de Poder (rango Maestro)"
		}, {
			id = "d7",
			act = 4,
			t = "El Festival del Origen",
			o = {
				k = "tourney",
				r = 3
			},
			r = {
				gemas = 40
			},
			h = "Queda en el Top 3 del torneo (Festival del Origen)",
			i = {{"heraldo", "Este año el torneo lo organiza el pueblo. Se llama Festival del Origen. Y el palco… está abierto para todos."}}
		}, {
			id = "d8",
			act = 4,
			t = "Un nombre nuevo",
			o = {
				k = "talk",
				who = "vant"
			},
			r = {
				gemas = 50
			},
			h = "Habla con Vant después del Festival",
			d = {{"vant", "Te vi pelear. No para quitarle nada a nadie. Para demostrar algo a ti."}, {"vant", "Devolví la última luz esta mañana. Era de una niña que me sonrió una vez, cuando nadie lo hacía."}, {"vant", "Ya no quiero que me llamen Anfitrión. Llámame Vant. Solo Vant."}, {"nar", "FIN DEL ACTO IV · Ánima sigue. Tú también. Gracias por jugar con el corazón."}}
		}, {
			id = "ep",
			act = 5,
			t = "Epílogo: Ánima libre",
			o = {
				k = "none"
			},
			r = {},
			h = "Juego libre: sigue mejorando, el torneo continúa"
		}},
	SIDE = {{
			id = "gato",
			who = "pip",
			t = "El gato de Pip",
			req = "a1",
			o = {
				k = "find",
				id = "gato",
				n = 1
			},
			r = {
				gemas = 10
			},
			h = "Busca a Bigotes en la Plaza (escucha los maullidos)",
			d = {{"pip", "¿Has visto a Bigotes? Es mi gato. Se escapó cuando sonaron las trompetas del Coliseo…"}, {"pip", "Le dan miedo los ruidos fuertes. Igual que a mí, la verdad."}},
			e = {{"pip", "¡BIGOTES! Gracias, gracias…"}, {"pip", "¿Sabes? A veces pienso que sin poder no sirvo para nada."}, {"pip", "Pero tú volviste con él. Eso no lo hace un brazalete. Lo hace una buena persona."}}
		}, {
			id = "disciplina",
			who = "ren",
			t = "Disciplina",
			req = "a2",
			o = {
				k = "perf",
				st = "tec",
				n = 10
			},
			r = {
				oro = 300,
				gemas = 5
			},
			h = "Logra 10 katas PERFECTAS (Dojo)",
			d = {{"ren", "La fuerza se gana en un día. La técnica, en mil. Haz diez katas perfectas."}, {"ren", "Si fallas, respira y vuelve a empezar. Nadie te apura."}},
			e = {{"ren", "Bien. ¿Notas que la paciencia también es un poder?"}}
		}, {
			id = "pedido",
			who = "tobias",
			t = "Pedido urgente",
			req = "a3",
			o = {
				k = "anvil",
				n = 40
			},
			r = {
				oro = 500,
				gemas = 5
			},
			h = "Golpea el yunque 40 veces (Forja)",
			d = {{"tobias", "¡Un pedido de herraduras para la Plaza y mi ayudante se fue al torneo!"}, {"tobias", "Cuarenta martillazos. Trabajo honesto, paga honesta."}},
			e = {{"tobias", "¡Perfecto! El oro que se gana trabajando pesa distinto en el bolsillo."}}
		}, {
			id = "patrulla",
			who = "kira",
			t = "Patrulla del anillo 2",
			req = "a4",
			o = {
				k = "kill",
				type = "lobo",
				n = 8
			},
			r = {
				chispas = 8,
				gemas = 5
			},
			h = "Derrota 8 Lobos de Ceniza (Tierras Rotas)",
			d = {{"kira", "Los lobos se están acercando a la Plaza. Si llegan, los niños no podrán jugar afuera."}, {"kira", "Ocho lobos. Ve con amigos si puedes: en grupo es más fácil."}},
			e = {{"kira", "Buen trabajo. Proteger a otros: para eso sirve la fuerza."}}
		}, {
			id = "leyendas",
			who = "heraldo",
			t = "Leyendas del Coliseo",
			req = "b1",
			o = {
				k = "tourney",
				r = 50,
				n = 1
			},
			r = {
				gemas = 10
			},
			h = "Queda en el Top 50 de un torneo",
			d = {{"heraldo", "Psst… ¿Sabías que ningún campeón antiguo volvió a pelear? Ni uno."}, {"heraldo", "Dicen que suben al palco del Anfitrión… y bajan distintos. Queda entre los 50 mejores y te cuento más."}},
			e = {{"heraldo", "Te lo cuento: bajan sin brillo en los ojos. Como si les faltara algo."}, {"heraldo", "Yo solo anuncio los combates. Pero no me gusta lo que veo."}}
		}, {
			id = "herramientas",
			who = "dax",
			t = "Herramientas para Dax",
			req = "c3",
			o = {
				k = "giveCh",
				n = 15
			},
			r = {
				gemas = 15
			},
			h = "Lleva 15 chispas a Dax (Tierras Rotas)",
			d = {{"dax", "El taller ya tiene techo. Me faltan chispas para la fragua de los aprendices."}, {"dax", "Quince chispas. Sé que cuestan… por eso te lo pido con respeto."}},
			e = {{"dax", "Mira: tres chicos aprendiendo a forjar. Hace un mes yo solo pensaba en mí."}}
		}, {
			id = "espejo",
			who = "nima",
			t = "El espejo del agua",
			req = "c1",
			o = {
				k = "perf",
				st = "esp",
				n = 5
			},
			r = {
				gemas = 15
			},
			title = "Alma Serena",
			h = "Logra 5 respiraciones PERFECTAS (Dojo)",
			d = {{"nima", "Mira tu reflejo en la cascada del Dojo. ¿Qué ves? ¿Un número? ¿O a alguien?"}, {"nima", "Respira cinco veces, perfecto. Luego vuelve."}},
			e = {{"nima", "El agua no refleja tu poder. Refleja tu calma."}, {"nima", "Te doy un nombre: Alma Serena. Úsalo cuando lo necesites."}}
		}, {
			id = "alfa",
			who = "kira",
			t = "El Alfa de Ceniza",
			req = "b1",
			o = {
				k = "kill",
				type = "alfa",
				n = 1
			},
			r = {
				chispas = 10,
				gemas = 10
			},
			h = "Derrota al Alfa de Ceniza (anillo 2)",
			d = {{"kira", "Hay un lobo enorme guiando a la manada. Le dicen el Alfa de Ceniza."}, {"kira", "Cuando baje la cabeza, va a embestir en línea recta. No te quedes delante: esquiva hacia un lado."}},
			e = {{"kira", "Lo lograste. Sin él, la manada se dispersa y deja de atacar a la gente."}, {"kira", "A veces el valor no es pelear más fuerte. Es leer al otro y moverse a tiempo."}}
		}, {
			id = "cosecha",
			who = "rosa",
			t = "La primera cosecha",
			req = "a3",
			o = {
				k = "harvest",
				n = 20
			},
			r = {
				oro = 800,
				gemas = 5
			},
			h = "Cosecha 20 veces en los Huertos del Valle",
			d = {{"rosa", "¡Ay, qué alegría ver gente joven en el valle! Mis rodillas ya no me dejan agacharme."}, {"rosa", "La tierra responde a la paciencia, igual que tu brazalete. Riega, espera y cosecha veinte veces."}},
			e = {{"rosa", "¡Mira qué canasta! Lo que siembras con cariño alimenta a muchos."}, {"rosa", "Vuelve cuando quieras. Aquí siempre hay sopa caliente."}}
		}, {
			id = "niebla",
			who = "elio",
			t = "Lo que guarda la niebla",
			req = "a5",
			o = {
				k = "chest",
				n = 3
			},
			r = {
				gemas = 15,
				chispas = 10
			},
			h = "Saca 3 cofres del Bosque de la Niebla y sal con vida",
			d = {{"elio", "Ese bosque no siempre fue así. La niebla son luces que perdieron la esperanza."}, {"elio", "Dentro hay cofres que dejaron los viajeros. Si te alcanzan las sombras, pierdes lo que llevas. Si sales, es tuyo."}, {"elio", "Regla del guardabosques: el miedo avisa, pero no manda."}},
			e = {{"elio", "Saliste. Y con las manos llenas."}, {"elio", "No es que no tuvieras miedo. Es que caminaste igual. Eso es valentía."}}
		}},
	DQ = {{
			k = "perf",
			st = "tec",
			n = 5,
			t = "Logra 5 katas perfectas"
		}, {
			k = "anvil",
			n = 30,
			t = "Golpea el yunque 30 veces"
		}, {
			k = "train",
			st = "fue",
			n = 80,
			t = "Golpea el saco 80 veces"
		}, {
			k = "train",
			st = "tec",
			n = 15,
			t = "Logra 15 katas"
		}, {
			k = "train",
			st = "esp",
			n = 5,
			t = "Completa 5 respiraciones"
		}, {
			k = "kill",
			n = 15,
			t = "Derrota 15 enemigos"
		}, {
			k = "oro",
			n = 0,
			t = "Gana oro"
		}, {
			k = "fish",
			n = 4,
			t = "Pesca 4 peces"
		}, {
			k = "harvest",
			n = 10,
			t = "Cosecha 10 veces"
		}, {
			k = "chest",
			n = 2,
			t = "Saca 2 cofres del Bosque"
		}, {
			k = "cook",
			n = 6,
			t = "Completa 6 rondas de cocina"
		}, {
			k = "visit",
			z = "coliseo",
			n = 1,
			t = "Visita el Coliseo"
		}, {
			k = "build",
			n = 3,
			t = "Mejora 3 edificios"
		}},
	FORGE = {{
			o = 2500,
			ch = 20
		}, {
			o = 25000,
			ch = 80
		}, {
			o = 250000,
			ch = 300
		}},
	NEWB = {
		o = 800,
		ch = 10
	},
	NA = {"Neo", "Kai", "Luna", "Dragon", "Sofi", "Mati", "Zero", "Nova", "Pixel", "Rex", "Mia", "Leo", "Vale", "Juli", "Thiago", "Emi", "Lucas", "Sami", "Ghost", "Blaze", "Storm", "Frost", "Ninja", "Crystal", "Moon", "Star", "Turbo", "Mega", "Cami", "Nico", "Isa", "Bruno", "Ari", "Dani", "Ozzy", "Kira", "Yuki", "Toto", "Pau", "Gabo"},
	NB = {"", "Pro", "YT", "_x", "XD", "Gamer", "777", "_RBX", "Kun", "Chan", "Master", "99", "Crack", "Real", "Sama", "2014", "_Oficial", "Dark", "Kid", "Max"},
	BAD = {"puta", "mierda", "idiota", "estupid", "fuck", "shit", "pendej", "marica", "culo", "verga", "nazi", "sex"},
	CYCLE = {"fuego", "viento", "tierra", "rayo", "agua"},
	FOE_EL = {
		eco = "sombra",
		lobo = "fuego",
		bandido = "tierra",
		golem = "tierra",
		sombra = "sombra",
		vant = "sombra",
		reyeco = "sombra",
		alfa = "fuego"
	},
	FRAG = {{
			id = "f1",
			z = "plaza",
			x = 2,
			y = 26,
			t = "El reparto",
			p = {"Hace mil años, el Brazalete del Origen se rompió en mil luces.", "Cada recién nacido de Ánima recibió una. Nadie recibió más que nadie.", "Por eso los brazaletes responden a lo que haces, no a quién eres."}
		}, {
			id = "f2",
			z = "dojo",
			x = 28,
			y = 4,
			t = "La primera competencia",
			p = {"Los primeros torneos eran fiestas en la cumbre.", "Se peleaba por honor y, al final, ganadores y perdedores comían juntos.", "Nadie perdía nada. Solo se aprendía."}
		}, {
			id = "f3",
			z = "forja",
			x = 31,
			y = 24,
			t = "El oro y la magia",
			p = {"Un día alguien descubrió que la magia podía volverse pan, herramientas y oro.", "Fue un gran invento. Hubo comida para todos.", "Pero algunos empezaron a guardar más de lo que necesitaban."}
		}, {
			id = "f4",
			z = "tierras",
			x = 9,
			y = 33,
			t = "Los Ecos",
			p = {"Cuando alguien abandona su poder por miedo o tristeza, queda un Eco.", "Los Ecos no son malos: están perdidos. Buscan a quien eran.", "Derrotarlos los libera. Por eso brillan al desaparecer."}
		}, {
			id = "f5",
			z = "tierras",
			x = 24,
			y = 3,
			t = "El niño sin luz",
			p = {"Una noche nació un bebé sin brazalete. Se llamaba Vant.", "Las otras familias apartaban a sus hijos de él, como si fuera contagioso.", "Vant aprendió a sonreír sin que la sonrisa le llegara a los ojos."}
		}, {
			id = "f6",
			z = "tierras",
			x = 42,
			y = 32,
			t = "La regla del cien",
			p = {"Ya adulto, Vant ofreció al Consejo un torneo grandioso: cien entran, uno gana.", "Todos aplaudieron. Nadie leyó la letra pequeña:", "“El poder perdido será custodiado por el Anfitrión”."}
		}, {
			id = "f7",
			z = "coliseo",
			x = 27,
			y = 21,
			t = "Lo que no se cuenta",
			p = {"En el palco, Vant guarda frascos de luz con nombres escritos a mano.", "Cada frasco es un pedazo de alguien que confió en él.", "A veces, de noche, les habla. Les pide perdón. Y vuelve a empezar."}
		}},
	CLANS = {{
			id = "llama",
			n = "Clan Llama Roja",
			ic = "🔥",
			c = "#e0262f",
			st = "fue",
			d = "Fuerza y coraje. +5% al entrenar Fuerza.",
			i = 0
		}, {
			id = "viento",
			n = "Clan Viento Verde",
			ic = "🍃",
			c = "#2dffb3",
			st = "tec",
			d = "Técnica y exploración. +5% al entrenar Técnica.",
			i = 1
		}, {
			id = "marea",
			n = "Clan Marea Azul",
			ic = "🌊",
			c = "#39c8ff",
			st = "esp",
			d = "Espíritu y comercio. +5% al entrenar Espíritu y +5% de oro del negocio.",
			i = 2
		}},
	CLANPTS = {
		kill = 1,
		train = 0.2,
		perf = 0.5,
		anvil = 0.05,
		build = 1,
		frag = 10,
		find = 5,
		fish = 0.5,
		cook = 0.5,
		harvest = 0.5,
		chest = 3
	},
	EVENTS = {{
			id = "dojo",
			n = "Semana del Dojo",
			ic = "🥋",
			d = "Entrenar rinde +25%.",
			train = 1.25
		}, {
			id = "feria",
			n = "Feria de la Forja",
			ic = "⚒️",
			d = "Tu negocio produce +25% de oro.",
			oro = 1.25
		}, {
			id = "ecos",
			n = "Luna de los Ecos",
			ic = "🌕",
			d = "Derrotar enemigos da +25% de poder y chispas dobles.",
			kill = 1.25,
			ch = 2
		}, {
			id = "amistad",
			n = "Semana de la Amistad",
			ic = "🤝",
			d = "La amistad crece el doble y los puntos de clan valen doble.",
			friend = 2,
			clan = 2
		}},
	ACH = {{
			id = "golpes",
			t = "Puño de hierro",
			d = "Entrena 500 veces",
			v = "taps",
			n = 500,
			g = 5
		}, {
			id = "caza",
			t = "Cazador de Ecos",
			d = "Derrota 100 enemigos",
			v = "kills",
			n = 100,
			g = 5
		}, {
			id = "mil",
			t = "Mil batallas",
			d = "Derrota 1.000 enemigos",
			v = "kills",
			n = 1000,
			g = 15
		}, {
			id = "noche",
			t = "Primera Noche",
			d = "Juega tu primer torneo",
			v = "tours",
			n = 1,
			g = 5
		}, {
			id = "veterano",
			t = "Veterano del Eclipse",
			d = "Juega 10 torneos",
			v = "tours",
			n = 10,
			g = 10
		}, {
			id = "campeon",
			t = "Campeón",
			d = "Gana un torneo",
			v = "wins",
			n = 1,
			g = 20
		}, {
			id = "millon",
			t = "Primer millón",
			d = "Gana 1 M de oro en total",
			v = "oroTot",
			n = 1000000,
			g = 15
		}, {
			id = "amigos",
			t = "Buena compañía",
			d = "Ten 5 amigos",
			v = "friends",
			n = 5,
			g = 5
		}, {
			id = "arqueo",
			t = "Arqueología",
			d = "Encuentra 3 fragmentos",
			v = "frag",
			n = 3,
			g = 5
		}, {
			id = "guardian",
			t = "Guardián",
			d = "Completa el Códice",
			v = "frag",
			n = 7,
			g = 15
		}, {
			id = "bondad",
			t = "Buena persona",
			d = "Completa 4 misiones secundarias",
			v = "side",
			n = 4,
			g = 10
		}, {
			id = "colec",
			t = "Coleccionista",
			d = "Ten 4 brazaletes",
			v = "brz",
			n = 4,
			g = 10
		}, {
			id = "guerrero",
			t = "Guerrero",
			d = "Alcanza 1.500 de Poder",
			v = "poder",
			n = 1500,
			g = 10
		}, {
			id = "leyenda",
			t = "Leyenda viva",
			d = "Alcanza 1 M de Poder",
			v = "poder",
			n = 1000000,
			g = 30
		}, {
			id = "clan",
			t = "Espíritu de equipo",
			d = "Aporta 200 puntos a tu clan en una semana",
			v = "clan",
			n = 200,
			g = 10
		}, {
			id = "final",
			t = "Fin del viaje",
			d = "Elige un final",
			v = "ending",
			n = 1,
			g = 20
		}, {
			id = "pesca",
			t = "Paciencia de agua",
			d = "Pesca las 8 especies",
			v = "fish",
			n = 8,
			g = 20
		}, {
			id = "chef",
			t = "Manos de panadero",
			d = "Completa 50 rondas de cocina",
			v = "cook",
			n = 50,
			g = 10
		}, {
			id = "granjero",
			t = "Manos de tierra",
			d = "Cosecha 200 veces",
			v = "harvest",
			n = 200,
			g = 15
		}, {
			id = "valiente",
			t = "El miedo avisa",
			d = "Saca 25 cofres del Bosque de la Niebla",
			v = "chest",
			n = 25,
			g = 20
		}},
	FISH = {{
			id = "linterna",
			n = "Pez Linterna",
			ic = "🐟",
			w = 40,
			v = 8,
			sp = 1,
			i = 0
		}, {
			id = "tinta",
			n = "Carpa de Tinta",
			ic = "🐠",
			w = 25,
			v = 14,
			sp = 1.2,
			i = 1
		}, {
			id = "arcoiris",
			n = "Trucha Arcoíris",
			ic = "🌈",
			w = 14,
			v = 25,
			sp = 1.4,
			i = 2
		}, {
			id = "brazalete",
			n = "Pez Brazalete",
			ic = "💍",
			w = 9,
			v = 45,
			sp = 1.6,
			i = 3
		}, {
			id = "anguila",
			n = "Anguila Rayo",
			ic = "⚡",
			w = 6,
			v = 80,
			sp = 1.9,
			i = 4
		}, {
			id = "koi",
			n = "Koi del Eclipse",
			ic = "🎏",
			w = 3.5,
			v = 150,
			sp = 2.1,
			i = 5
		}, {
			id = "fantasma",
			n = "Pez Fantasma",
			ic = "👻",
			w = 2,
			v = 260,
			sp = 2.4,
			i = 6
		}, {
			id = "leviatan",
			n = "Leviatán Bebé",
			ic = "🐉",
			w = 0.5,
			v = 900,
			sp = 2.8,
			i = 7
		}}
}
