# SERVERADDR=195.201.137.105:9999
SERVERADDR=localhost:9999
LOGINID=_super1
LOGINPASS=!password!@\#
COOKIE_FILE=/tmp/the_cookie.tmp
SYS_COOKIE_FILE=/tmp/sys_cookies.tmp
SUPER_COOKIE_FILE=/tmp/super_cookies.tmp
ADMIN_COOKIE_FILE=/tmp/ADMIN_cookies.tmp
SELLER_COOKIE_FILE=/tmp/SELLER_cookies.tmp
USER_COOKIE_FILE=/tmp/USER_cookies.tmp
OP_COOKIE_FILE=/tmp/op_cookies.tmp
UPDATEID=1
REQ=curl -b $(COOKIE_FILE) $(SERVERADDR)
OPREQ=curl -b $(OP_COOKIE_FILE) $(SERVERADDR)
RND=$(shell bash -c 'echo $$RANDOM')
ifndef OPID
  OPID=op1
endif
OPPASS=op
BALL=0
CARD=1
TGNAME=test
TGTYPE=0

get_game_data:$(USER_COOKIE_FILE)
  $(REQ)/games/tombala/1 -i
get_wallets:$(cookie_file)
  $(REQ)/users/wallets/$(or ${UID},_user1)?ids=$(or ${ids},1) -i
update_credit:$(COOKIE_FILE)
  $(REQ)/users/credit/$(or ${UID},_user1) -iX PATCH -d "amount=$(or ${amount},1)&is_bonus=$(or ${is_bonus},true)&game_id=$(or ${game_id},1)"
lock_card:$(SELLER_COOKIE_FILE)
  $(REQ)/games/tombala/cards/lock/$(TGID)/$(CARD) -iX POST
unlock_card:$(SELLER_COOKIE_FILE)
  $(REQ)/games/tombala/cards/unlock/$(TGID)/$(CARD) -iX POST
update_table:$(SELLER_COOKIE_FILE)
  $(REQ)/games/tombala/tbl/$(TID) -X PATCH -i -d $(DATA)
del_table:$(SELLER_COOKIE_FILE)
  $(REQ)/games/tombala/tbl/$(TID) -X DELETE -i
add_table:$(SELLER_COOKIE_FILE)
  $(REQ)/games/tombala/tbl -i -d "group_id=$(TGID)&name=tbl&price=5&c1=1&c2=2&t=4&tulum=5&first_5=6&min_cards=$(or ${TMIN},1)"
del_table_group:$(SELLER_COOKIE_FILE)
  $(REQ)/games/tombala/tg/$(TGID) -X DELETE -i
add_table_group:$(SELLER_COOKIE_FILE)
  $(REQ)/games/tombala/tg -i -d "name=$(TGNAME)&game_id=1&group_type=$(TGTYPE)"
get_children:$(COOKIE_FILE)
  $(REQ)/users/children
tombala_op_add_ball:$(OP_COOKIE_FILE)
  $(OPREQ)/games/tombala/op/ball/$(BALL) -i -X POST
tombala_op_game_data:$(OP_COOKIE_FILE)
  $(OPREQ)/games/tombala/op -i
create_new_tombala_game:$(SUPER_COOKIE_FILE)
  $(REQ)/games/tombala/new -X POST -i -d 'game_name=tombala&operator_id=$(OPID)&operator_password=op&auto=true&cards=$(shell cat ./defaultcards.json)'
update_tombala_game:$(SUPER_COOKIE_FILE)
  $(REQ)/games/tombala/$(UPDATEID) -X PATCH -i -d "$(UPDATEFIELDS)"
me:$(COOKIE_FILE)
  $(REQ)/users/me -i
$(SYS_COOKIE_FILE):
  curl $(SERVERADDR)/users/login  -d "id=_system1&password=$(LOGINPASS)" -c $(SYS_COOKIE_FILE)
  ln -fs $(SYS_COOKIE_FILE) $(COOKIE_FILE)
$(SUPER_COOKIE_FILE):
  curl $(SERVERADDR)/users/login  -d "id=_super1&password=$(LOGINPASS)" -c $(SUPER_COOKIE_FILE)
  ln -fs $(SUPER_COOKIE_FILE) $(COOKIE_FILE)
$(ADMIN_COOKIE_FILE):
  curl $(SERVERADDR)/users/login  -d "id=_admin1&password=$(LOGINPASS)" -c $(ADMIN_COOKIE_FILE)
  ln -fs $(ADMIN_COOKIE_FILE) $(COOKIE_FILE)
$(SELLER_COOKIE_FILE):
  curl $(SERVERADDR)/users/login  -d "id=_seller1&password=$(LOGINPASS)" -c $(SELLER_COOKIE_FILE)
  ln -fs $(SELLER_COOKIE_FILE) $(COOKIE_FILE)
$(USER_COOKIE_FILE):
  curl $(SERVERADDR)/users/login  -d "id=_user1&password=$(LOGINPASS)" -c $(USER_COOKIE_FILE)
  ln -fs $(USER_COOKIE_FILE) $(COOKIE_FILE)
$(OP_COOKIE_FILE):
  curl $(SERVERADDR)/games/tombala/op/login  -d "id=$(OPID)&password=$(OPPASS)" -c $(OP_COOKIE_FILE)
target/debug/game-system:
  cargo build
target/debug/game_tombala:
  cd ./game_tombala/  && cargo build
target/debug/ws:
  cd ./ws/  && cargo build
deployDev:target/debug/game-system target/debug/game_tombala target/debug/ws
  rsync -vaurz --progress $^ mugsoft.io:/opt/target/debug/
deployTools:docker-compose.yml Makefile defaultcards.json
  rsync -vaurz --progress $^ mugsoft.io:/opt/
restartServer:
  ssh mugsoft.io "docker-compose -f /opt/docker-compose.yml restart"