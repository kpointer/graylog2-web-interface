/*
 * Copyright 2013 TORCH UG
 *
 * This file is part of Graylog2.
 *
 * Graylog2 is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Graylog2 is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Graylog2.  If not, see <http://www.gnu.org/licenses/>.
 */
package models.api.requests;

import com.google.common.collect.Lists;
import models.User;
import play.data.validation.Constraints;

import java.util.List;

public class ChangeUserRequest extends ApiRequest {
    @Constraints.Required
    public String fullname;
    @Constraints.Required
    public String email;

    public List<String> permissions;

    public String timezone;

    public ChangeUserRequest() { /* for data binding */ }

    public ChangeUserRequest(User user) {
        this.fullname = user.getFullName();
        this.email = user.getEmail();
        this.permissions = Lists.newArrayList("*"); // TODO PREVIEW user.getPermissions();
        if (user.getTimeZone() != null) {
            this.timezone = user.getTimeZone().getID();
        }
    }
}
