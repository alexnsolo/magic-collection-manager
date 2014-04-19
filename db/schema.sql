create table if not exists expansions(
    id integer primary key autoincrement,
    name text unique
);
create index if not exists expansion_name on expansions(name asc);

create table if not exists cards(
    id integer primary key,
    name text,
    type text,
    expansion integer references expansions(id) on delete cascade,
    rarity text,
    manacost varchar(50),
    fulltext text,
    full blob
);
create index if not exists card_name on cards(name asc);

create table if not exists locations(
    id integer primary key asc,
    text name unique
);

create table if not exists collection(
    id integer primary key autoincrement,
    card integer references cards(id) on delete cascade,
    foil integer default 0,
    alternate_art integer default 0,
    condition text,
    location integer references locations(id) on delete set null
);

create table if not exists lists(
    id integer primary key asc,
    text name unique
);

create table if not exists collection_list(
    cid integer references collection(id) on delete cascade,
    list integer references list(id) on delete cascade
);

create view if not exists collection_cards as select max(card.id) as id, card.name as name, card.manacost as manacost, card.type as type, card.rarity as rarity, count(coll.id) as quantity
    from cards as card
    inner join collection as coll on card.id = coll.card
    group by card.name order by card.name asc;

update collection set foil = 0 where foil is null;
update collection set alternate_art = 0 where alternate_art is null;
