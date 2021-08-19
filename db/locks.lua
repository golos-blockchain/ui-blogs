function lock_entity(entity_name)
    local space = box.space.locks
    local res = space:select{entity_name}
    if #res > 0 then
      local tuple = res[1]
      return false
    else
      local tuple = {entity_name}
      space:insert(tuple)
      return true
    end
end

function unlock_entity(entity_name)
    local space = box.space.locks
    return space:delete{entity_name}
end

function has_lock(entity_name)
    local space = box.space.locks
    local res = space:select{entity_name}
    return #res > 0
end
