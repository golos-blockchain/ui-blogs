require 'locks'

io.output():setvbuf('no')

box.cfg {
    log_level = 5,
    listen = '0.0.0.0:3301',
    memtx_memory = 1 * 1024 * 1024 * 1024,
    wal_dir   = '/var/lib/tarantool',
    memtx_dir  = '/var/lib/tarantool',
    vinyl_dir = '/var/lib/tarantool'
}

box.once('bootstrap', function()
    print('initializing..')
    box.schema.user.grant('guest', 'read,write,execute,create,drop,alter ', 'universe')
    box.session.su('guest')

    box.schema.sequence.create('users')
    users = box.schema.create_space('users', {
        format = {
            {name = 'id', type = 'unsigned'},
            {name = 'uid', type = 'STR'},
            {name = 'verify_type', type = 'STR'},
            {name = 'verify_id', type = 'STR'},
            {name = 'verified', type = 'boolean'},
            {name = 'confirmation_code', type = 'STR'},
            {name = 'remote_ip', type = 'STR'},
            {name = 'registered', type = 'boolean'},
        }
    })
    users:create_index('primary', {
        sequence = 'users'
    })
    users:create_index('by_uid', {
        type = 'tree', parts = {'uid'}, unique = false
    })
    users:create_index('by_verify', {
        type = 'tree', parts = {'verify_type', 'verify_id', 'verified'}, unique = false
    })
    users:create_index('by_verify_registered', {
        type = 'tree', parts = {'verify_type', 'verify_id', 'registered'}, unique = false
    })
    users:create_index('by_verify_uid', {
        type = 'tree', parts = {'verify_type', 'verify_id', 'uid', 'verified'}, unique = false
    })
    users:create_index('by_remote_ip', {
        type = 'tree', parts = {'remote_ip'}, unique = false
    })

    box.schema.sequence.create('accounts')
    accounts = box.schema.create_space('accounts', {
        format = {
            {name = 'id', type = 'unsigned'},
            {name = 'user_id', type = 'unsigned'},
            {name = 'name', type = 'STR'},
            {name = 'owner_key', type = 'STR'},
            {name = 'active_key', type = 'STR'},
            {name = 'posting_key', type = 'STR'},
            {name = 'memo_key', type = 'STR'},
            {name = 'referrer', type = 'STR'},
            {name = 'refcode', type = 'STR'},
            {name = 'created_at', type = 'STR'}, -- it is STR due to https://github.com/tarantool/node-tarantool-driver/issues/49
            {name = 'email', type = 'STR'}, -- raw email, not hash. For admin
            {name = 'remote_ip', type = 'STR'},
        }
    })
    accounts:create_index('primary', {
        sequence='accounts'
    })
    accounts:create_index('by_user_id', {
        type = 'tree', parts = {'user_id'}, unique = false
    })
    accounts:create_index('by_name', {
        type = 'tree', parts = {'name'}, unique = true
    })
    accounts:create_index('by_remote_ip', {
        type = 'tree', parts = {'remote_ip'}, unique = false
    })

    locks = box.schema.create_space('locks')
    locks:create_index('primary', {type = 'tree', parts = {1, 'STR'}})
end)
